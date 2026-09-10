from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
import models
from database import engine, Base, SessionLocal
from datetime import date
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Annotated, List
from fastapi.middleware.cors import CORSMiddleware
import openpyxl
import io
from dotenv import load_dotenv
import os

from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

load_dotenv()

app = FastAPI()
Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",
    "https://expenses.analyzeforce.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

class ExpenseBase(BaseModel):
    amount: float
    category: str
    description: str
    date: date

class ExpenseModel(ExpenseBase):
    id: int
    class Config:
        from_attributes = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=os.getenv("OPENAI_API_KEY")
)

@tool
def sql_db_list_tables() -> str:
    """Input is an empty string, output is a comma-separated list of tables in the database."""
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public';"))
        tables = [row[0] for row in result]
        return ", ".join(tables)
    finally:
        db.close()

@tool
def sql_db_schema(table_names: str) -> str:
    """Input is a comma-separated list of tables, output is the schema."""
    db = SessionLocal()
    try:
        results = []
        for table in table_names.split(","):
            table = table.strip()
            result = db.execute(text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='{table}';"))
            cols = [f"{row[0]}: {row[1]}" for row in result]
            results.append(f"Table {table}:\n" + "\n".join(cols))
        return "\n\n".join(results)
    finally:
        db.close()

@tool
def sql_db_query(query: str) -> str:
    """Input is a correct SQL query, output is the result from the database."""
    db = SessionLocal()
    try:
        result = db.execute(text(query))
        return str(result.fetchall())
    except Exception as e:
        return f"Error: {e}"
    finally:
        db.close()

@tool
def sql_db_query_checker(query: str) -> str:
    """Double check the SQL query before executing it."""
    prompt = f"""{query}
تحقق من هاد الاستعلام للأخطاء الشائعة:
- NOT IN مع NULL
- UNION vs UNION ALL
- نوع البيانات غلط
- أسماء الأعمدة غلط
لو في أخطاء أعد كتابة الاستعلام، لو ما في أعد الاستعلام كما هو.
SQL Query:"""
    response = llm.invoke(prompt)
    return response.content.strip()

tools = [sql_db_list_tables, sql_db_schema, sql_db_query_checker, sql_db_query]

system_prompt = """
أنت مساعد ذكي متخصص في تحليل المصاريف الشخصية.
قاعدة البيانات فيها جدول expenses يحتوي على:
- amount: المبلغ
- category: الفئة
- description: الوصف
- date: التاريخ

قواعد:
- رد دائماً بالعربي
- اعرض الأرقام مع رمز الدولار
- تحقق من SQL قبل التنفيذ دائماً
- لا تساوي INSERT, UPDATE, DELETE, DROP
"""

agent = create_react_agent(llm, tools, prompt=system_prompt)

@app.get("/")
async def root():
    return {"message": "App is running"}

@app.get("/expenses/", response_model=List[ExpenseModel])
async def get_expenses(
    db: db_dependency,
    category: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    description: str | None = None,
):
    query = db.query(models.Expense)
    if category:    query = query.filter(models.Expense.category == category)
    if description: query = query.filter(models.Expense.description.contains(description))
    if min_amount:  query = query.filter(models.Expense.amount >= min_amount)
    if max_amount:  query = query.filter(models.Expense.amount <= max_amount)
    if date_from:   query = query.filter(models.Expense.date >= date_from)
    if date_to:     query = query.filter(models.Expense.date <= date_to)
    return query.all()

@app.post("/expenses/", response_model=ExpenseModel)
async def create_expense(expense: ExpenseBase, db: db_dependency):
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.put("/expenses/{expense_id}", response_model=ExpenseModel)
async def update_expense(expense_id: int, expense: ExpenseBase, db: db_dependency):
    data = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="غير موجود")
    data.category    = expense.category
    data.amount      = expense.amount
    data.description = expense.description
    data.date        = expense.date
    db.commit()
    db.refresh(data)
    return data

@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: db_dependency):
    data = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="غير موجود")
    db.delete(data)
    db.commit()
    return {"message": "تم الحذف بنجاح"}

@app.post("/expenses/upload/")
async def upload_expenses(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(contents))
    ws = wb.active
    for row in ws.iter_rows(min_row=2, values_only=True):
        amount, category, description, date = row
        db_expense = models.Expense(amount=amount, category=category, description=description, date=date)
        db.add(db_expense)
    db.commit()
    return {"message": "تم رفع الملف بنجاح"}

@app.get("/expenses/analytics")
async def get_analytics(
    db: db_dependency,
    category: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    base_query = db.query(models.Expense)
    if category:  base_query = base_query.filter(models.Expense.category == category)
    if date_from: base_query = base_query.filter(models.Expense.date >= date_from)
    if date_to:   base_query = base_query.filter(models.Expense.date <= date_to)

    total = sum(e.amount for e in base_query.all()) or 0

    by_category = [
        {"category": row.category, "total": row.total, "percentage": round((row.total / total) * 100, 1) if total else 0}
        for row in base_query.with_entities(models.Expense.category, func.sum(models.Expense.amount).label("total")).group_by(models.Expense.category).all()
    ]

    by_date = [
        {"date": str(row.date), "total": row.total}
        for row in base_query.with_entities(models.Expense.date, func.sum(models.Expense.amount).label("total")).group_by(models.Expense.date).order_by(models.Expense.date.asc()).all()
    ]

    return {"total": total, "by_category": by_category, "by_date": by_date}

@app.post("/chat/")
async def chat(question: str):
    response = agent.invoke({"messages": [{"role": "user", "content": question}]})
    
    steps = []
    for msg in response["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tool_call in msg.tool_calls:
                steps.append({
                    "tool": tool_call["name"],
                    "input": tool_call["args"]
                })
    
    return {
        "answer": response["messages"][-1].content,
        "steps": steps
    }