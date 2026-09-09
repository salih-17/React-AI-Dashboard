from sqlalchemy import Column , Integer , String , Float , Date
from database import Base
from datetime import date

class Expense (Base):
    __tablename__ = 'expenses'
    id = Column (Integer , primary_key=True , index=True)
    amount = Column (Float)
    category = Column (String)
    description = Column (String)
    date = Column(Date, default=date.today)
    