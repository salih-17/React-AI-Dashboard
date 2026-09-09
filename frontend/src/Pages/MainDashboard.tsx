import { useState } from "react";
import { BarChart2, Table2, Bot } from "lucide-react";
import AnalyticsSection from "@/Pages/AnalyticsSection";
import TableSection from "@/Pages/TableSection";
import ChatSection from "@/Pages/ChatSection";

export default function MainDashboard() {
  const [filters, setFilters] = useState({ category: "", date_from: "", date_to: "" });
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة المصاريف</h1>
          <p className="text-sm text-gray-400">إدارة وتحليل مصاريفك الشخصية</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-sm font-medium">عبد الرحمن صالح</p>
          </div>
          <img src="/Mypicture.png" alt="عبد الرحمن صالح" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 items-stretch">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={18} />
            <span className="font-medium text-sm">التحليل</span>
          </div>
          <AnalyticsSection filters={filters} setFilters={setFilters} refreshKey={refreshKey} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Table2 size={18} />
            <span className="font-medium text-sm">المصاريف</span>
          </div>
          <TableSection filters={filters} onRefresh={() => setRefreshKey((prev) => prev + 1)} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bot size={18} />
            <span className="font-medium text-sm">المساعد الذكي</span>
          </div>
          <ChatSection />
        </div>
      </div>
    </div>
  );
}
