import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useState } from "react";
import axios from "axios";

export default function AddExpense() {
  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
  });

  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    await axios.post("http://localhost:8000/expenses/", {
      amount: Number(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
    });

    setForm({ amount: "", category: "", description: "", date: "" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);

    console.log("Done!!!!!");
  }

  const [isDragging, setIsDragging] = useState(false);
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await axios.post("http://localhost:8000/expenses/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }
  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl p-8 shadow-md border">
      <h2 className="text-2xl font-bold mb-8 text-gray-800">إضافة مصروف جديد</h2>

      <div className="flex flex-col gap-4">
        <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} type="number" placeholder="المبلغ" />

        <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value ?? "" })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر الفئة" />
          </SelectTrigger>
          <SelectContent dir="rtl" className="bg-white border shadow-md z-50">
            <SelectItem value="طعام" className="hover:bg-gray-100 cursor-pointer">
              طعام
            </SelectItem>
            <SelectItem value="مواصلات" className="hover:bg-gray-100 cursor-pointer">
              مواصلات
            </SelectItem>
            <SelectItem value="صحة" className="hover:bg-gray-100 cursor-pointer">
              صحة
            </SelectItem>
            <SelectItem value="ترفيه" className="hover:bg-gray-100 cursor-pointer">
              ترفيه
            </SelectItem>
            <SelectItem value="أخرى" className="hover:bg-gray-100 cursor-pointer">
              أخرى
            </SelectItem>
          </SelectContent>
        </Select>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="الوصف" />
        <Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" />
        <Button onClick={handleSubmit}>إضافة</Button>
        {success && <p className="text-green-600 text-sm text-center"> ✅ تم إضافة المصروف بنجاح! </p>}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-2 border-2 border-dashed rounded-xl p-6 text-center transition-colors
    ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 text-gray-400"}`}
        >
          📂 اسحب ملف Excel وأفلته هنا
        </div>
      </div>
    </div>
  );
}
