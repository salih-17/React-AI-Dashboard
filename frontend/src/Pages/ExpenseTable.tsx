import axios from "axios";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ExpenseTable() {
  const [expenses, setExpenses] = useState([]);
  const [editExpense, setEditExpense] = useState<any>(null);

  useEffect(() => {
    axios.get("http://localhost:8000/expenses/").then((res) => setExpenses(res.data));
  }, []);

  async function handleDelete(id: number) {
    await axios.delete(`http://localhost:8000/expenses/${id}`);
    const res = await axios.get("http://localhost:8000/expenses/");
    setExpenses(res.data);
  }

  async function handleEdit() {
    await axios.put(`http://localhost:8000/expenses/${editExpense.id}`, {
      amount: Number(editExpense.amount),
      category: editExpense.category,
      description: editExpense.description,
      date: editExpense.date,
    });
    setEditExpense(null);
    const res = await axios.get("http://localhost:8000/expenses/");
    setExpenses(res.data);
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border">
      <h2 className="text-2xl font-bold mb-6 text-gray-800"> جدول المصاريف</h2>

      <table className="w-full text-right">
        <thead>
          <tr className="border-b text-gray-500 text-sm">
            <th className="pb-3"> المبلغ</th>
            <th className="pb-3"> الفئة</th>
            <th className="pb-3"> الوصف</th>
            <th className="pb-3"> التاريخ</th>
            <th className="pb-3"> إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expenses: any) => (
            <tr key={expenses.id} className="border-b transition-colors duration-200 hover:bg-blue-50 hover:shadow-sm">
              <td className="py-3">{expenses.amount}</td>
              <td className="py-3">{expenses.category}</td>
              <td className="py-3">{expenses.description}</td>
              <td className="py-3">{expenses.date}</td>
              <td className="py-3 flex gap-2">
                <button onClick={() => setEditExpense(expenses)} className="text-blue-500 hover:text-blue-700 text-sm cursor-pointer">
                  تعديل
                </button>
                <button onClick={() => handleDelete(expenses.id)} className="text-red-500 hover:text-red-700 text-sm cursor-pointer">
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={editExpense !== null} onOpenChange={() => setEditExpense(null)}>
        <DialogContent dir="rtl" className="bg-white border shadow-lg fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <DialogHeader className="pt-2 pr-6">
            <DialogTitle>تعديل المصروف</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Input
              type="number"
              placeholder="المبلغ"
              value={editExpense?.amount || ""}
              onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
            />
            <Input
              placeholder="الفئة"
              value={editExpense?.category || ""}
              onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
            />
            <Input
              placeholder="الوصف"
              value={editExpense?.description || ""}
              onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
            />
            <Input type="date" value={editExpense?.date || ""} onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })} />
            <Button onClick={handleEdit}>حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
