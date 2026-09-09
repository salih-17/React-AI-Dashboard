import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";

export default function Analytics() {
  const [data, setData] = useState<any>(null);

  const [filters, setFilters] = useState({
    category: "",
    date_from: "",
    date_to: "",
  });

  useEffect(() => {
    const params: any = {};
    if (filters.category) params.category = filters.category;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    axios.get("http://localhost:8000/expenses/analytics", { params }).then((res) => setData(res.data));
  }, [filters]);
  if (!data) return <p>جاري التحميل...</p>;

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-md border flex gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">الفئة</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">الكل</option>
            <option value="طعام">طعام</option>
            <option value="مواصلات">مواصلات</option>
            <option value="صحة">صحة</option>
            <option value="ترفيه">ترفيه</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">من</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">إلى</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          />
        </div>

        <button
          onClick={() => setFilters({ category: "", date_from: "", date_to: "" })}
          className="text-sm text-red-500 hover:text-red-700 pb-2"
        >
          مسح الفلاتر
        </button>
      </div>
      {/* بطاقة الإجمالي */}
      <div className="bg-white rounded-2xl p-8 shadow-md border">
        <p className="text-gray-500 text-sm mb-2">إجمالي المصاريف</p>
        <h1 className="text-4xl font-bold text-gray-800">{formatCurrency(data.total)}</h1>
      </div>
      {/* Donut Chart — المصاريف حسب الفئة */}
      <div className="bg-white rounded-2xl p-8 shadow-md border">
        <h2 className="text-xl font-bold text-gray-800 mb-6">المصاريف حسب الفئة</h2>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data.by_category} dataKey="total" nameKey="category" innerRadius={90} outerRadius={120} paddingAngle={3}>
              {data.by_category.map((_: any, index: number) => (
                <Cell key={index} fill={["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"][index % 5]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* نسبة كل فئة من الإجمالي */}
      <div className="bg-white rounded-2xl p-8 shadow-md border">
        <h2 className="text-xl font-bold text-gray-800 mb-6">نسبة كل فئة</h2>

        <div className="flex flex-col gap-4">
          {data.by_category.map((item: any, index: number) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{item.category}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"][index % 5],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* المصاريف اليومية */}
      <div className="bg-white rounded-2xl p-8 shadow-md border">
        <h2 className="text-xl font-bold text-gray-800 mb-6">المصاريف اليومية</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.by_date}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
