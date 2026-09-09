import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import * as XLSX from "xlsx";

const API = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 14;

const CATEGORY_COLORS: Record<string, string> = {
  طعام: "#000000",
  مواصلات: "#333333",
  صحة: "#666666",
  ترفيه: "#999999",
  أخرى: "#cccccc",
};

interface Props {
  filters: { category: string; date_from: string; date_to: string };
  onRefresh: () => void;
}

type SortKey = "id" | "amount" | "category" | "description" | "date";

export default function TableSection({ filters, onRefresh }: Props) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", description: "", date: "" });
  const [selected, setSelected] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(false);

  async function fetchExpenses() {
    const params: any = {};
    if (filters.category) params.category = filters.category;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    const res = await axios.get(`${API}/expenses/`, { params });
    setExpenses(res.data);
    setPage(1);
    setSelected([]);
  }

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const sorted = [...expenses].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function exportToExcel() {
    const toExport = selected.length > 0 ? expenses.filter((e) => selected.includes(e.id)) : expenses;
    const ws = XLSX.utils.json_to_sheet(toExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المصاريف");
    XLSX.writeFile(wb, "expenses.xlsx");
  }

  function toggleSelect(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function toggleAll() {
    if (selected.length === paginated.length) setSelected([]);
    else setSelected(paginated.map((e) => e.id));
  }

  async function handleDelete(id: number) {
    await axios.delete(`${API}/expenses/${id}`);
    fetchExpenses();
    onRefresh();
  }

  async function handleDeleteSelected() {
    await Promise.all(selected.map((id) => axios.delete(`${API}/expenses/${id}`)));
    fetchExpenses();
    onRefresh();
  }

  async function handleEdit() {
    await axios.put(`${API}/expenses/${editExpense.id}`, {
      amount: Number(editExpense.amount),
      category: editExpense.category,
      description: editExpense.description,
      date: editExpense.date,
    });
    setEditExpense(null);
    fetchExpenses();
    onRefresh();
  }

  async function handleAdd() {
    await axios.post(`${API}/expenses/`, {
      amount: Number(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
    });
    setShowAdd(false);
    setForm({ amount: "", category: "", description: "", date: "" });
    fetchExpenses();
    onRefresh();
  }

  function SortButton({ col }: { col: SortKey }) {
    return (
      <button onClick={() => handleSort(col)} className="inline-flex items-center gap-1 hover:text-black">
        <ArrowUpDown size={12} />
      </button>
    );
  }

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-bold">المصاريف</CardTitle>
          <div className="flex gap-2">
            {selected.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDeleteSelected} className="text-red-500 border-red-200 hover:bg-red-50">
                <Trash2 size={14} className="ml-1" />
                حذف ({selected.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              {selected.length > 0 ? `تصدير (${selected.length})` : "تصدير Excel"}
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} className="bg-black text-white hover:bg-gray-800">
              + إضافة
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-2 w-8">
                <Checkbox checked={selected.length === paginated.length && paginated.length > 0} onCheckedChange={toggleAll} />
              </th>
              <th className="pb-2">
                # <SortButton col="id" />
              </th>
              <th className="pb-2">
                المبلغ <SortButton col="amount" />
              </th>
              <th className="pb-2">
                الفئة <SortButton col="category" />
              </th>
              <th className="pb-2">
                الوصف <SortButton col="description" />
              </th>
              <th className="pb-2">
                التاريخ <SortButton col="date" />
              </th>
              <th className="pb-2">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((expense: any) => (
              <tr
                key={expense.id}
                className={`border-b transition-colors duration-200 ${selected.includes(expense.id) ? "bg-gray-50" : "hover:bg-gray-50"}`}
              >
                <td className="py-2">
                  <Checkbox checked={selected.includes(expense.id)} onCheckedChange={() => toggleSelect(expense.id)} />
                </td>
                <td className="py-2 text-gray-400">{expense.id}</td>
                <td className="py-2">${expense.amount}</td>
                <td className="py-2">
                  <span
                    className="px-2 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: CATEGORY_COLORS[expense.category] || "#000" }}
                  >
                    {expense.category}
                  </span>
                </td>
                <td className="py-2 text-gray-500">{expense.description}</td>
                <td className="py-2 text-gray-500">{expense.date}</td>
                <td className="py-2 flex gap-2">
                  <button onClick={() => setEditExpense(expense)} className="text-gray-400 hover:text-black transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(expense.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            {expenses.length} سطر — صفحة {page} من {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              السابق
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>
              التالي
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Dialog تعديل */}
      <Dialog open={editExpense !== null} onOpenChange={() => setEditExpense(null)}>
        <DialogContent dir="rtl" className="bg-white border shadow-lg">
          <DialogHeader className="pt-2 pr-6">
            <DialogTitle>تعديل المصروف</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              type="number"
              value={editExpense?.amount || ""}
              onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
              placeholder="المبلغ"
            />
            <Input
              value={editExpense?.category || ""}
              onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
              placeholder="الفئة"
            />
            <Input
              value={editExpense?.description || ""}
              onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
              placeholder="الوصف"
            />
            <Input type="date" value={editExpense?.date || ""} onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })} />
            <Button onClick={handleEdit} className="bg-black text-white hover:bg-gray-800">
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog إضافة */}
      <Dialog open={showAdd} onOpenChange={() => setShowAdd(false)}>
        <DialogContent dir="rtl" className="bg-white border shadow-lg">
          <DialogHeader className="pt-2 pr-6">
            <DialogTitle>إضافة مصروف</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="المبلغ" />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? "" })}>
              <SelectTrigger>
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent dir="rtl" className="bg-white border shadow-md z-50">
                <SelectItem value="طعام">طعام</SelectItem>
                <SelectItem value="مواصلات">مواصلات</SelectItem>
                <SelectItem value="صحة">صحة</SelectItem>
                <SelectItem value="ترفيه">ترفيه</SelectItem>
                <SelectItem value="أخرى">أخرى</SelectItem>
              </SelectContent>
            </Select>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="الوصف" />
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Button onClick={handleAdd} className="bg-black text-white hover:bg-gray-800">
              إضافة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
