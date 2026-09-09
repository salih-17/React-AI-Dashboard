import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Trash2 } from "lucide-react";
import { Pie, PieChart } from "recharts";

const API = import.meta.env.VITE_API_URL;

const chartConfig = {
  total: { label: "إجمالي المصاريف" },
  طعام: { label: "طعام", color: "#000000" },
  مواصلات: { label: "مواصلات", color: "#333333" },
  صحة: { label: "صحة", color: "#666666" },
  ترفيه: { label: "ترفيه", color: "#999999" },
  أخرى: { label: "أخرى", color: "#cccccc" },
} satisfies ChartConfig;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

interface Props {
  filters: { category: string; date_from: string; date_to: string };
  setFilters: (filters: any) => void;
  refreshKey: number;
}

export default function AnalyticsSection({ filters, setFilters, refreshKey }: Props) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const params: any = {};
    if (filters.category) params.category = filters.category;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    axios.get(`${API}/expenses/analytics`, { params }).then((res) => setData(res.data));
  }, [filters, refreshKey]);

  if (!data) return <p className="text-gray-400 text-center">جاري التحميل...</p>;

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg font-bold">التحليل</CardTitle>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">الفئة</label>
              <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v ?? "" })}>
                <SelectTrigger className="w-32 text-sm">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent dir="rtl" className="bg-white border shadow-md z-50">
                  <SelectItem value="">الكل</SelectItem>
                  <SelectItem value="طعام">طعام</SelectItem>
                  <SelectItem value="مواصلات">مواصلات</SelectItem>
                  <SelectItem value="صحة">صحة</SelectItem>
                  <SelectItem value="ترفيه">ترفيه</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">من</label>
              <Input
                type="date"
                className="w-36 text-sm"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">إلى</label>
              <Input
                type="date"
                className="w-36 text-sm"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            {(filters.category || filters.date_from || filters.date_to) && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 opacity-0">مسح</label>
                <button
                  onClick={() => setFilters({ category: "", date_from: "", date_to: "" })}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">إجمالي المصاريف</p>
          <p className="text-3xl font-bold">{formatCurrency(data.total)}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium mb-2">حسب الفئة</p>
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <Pie
                data={data.by_category.map((item: any) => ({
                  ...item,
                  fill: chartConfig[item.category as keyof typeof chartConfig]?.color || "#000",
                }))}
                dataKey="total"
                nameKey="category"
                outerRadius={80}
              />
              <ChartTooltip content={<ChartTooltipContent className="bg-white border shadow-md" />} />
              <ChartLegend content={<ChartLegendContent nameKey="category" />} className="flex-wrap gap-2" />
            </PieChart>
          </ChartContainer>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">المصاريف اليومية</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.by_date}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="total" stroke="#000" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
