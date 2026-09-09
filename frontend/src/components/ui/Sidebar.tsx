import { LayoutDashboard, PlusCircle, Table } from "lucide-react";

const navItem = [
  { id: "add", label: "إضافة مصروف", icon: PlusCircle },
  { id: "table", label: "جدول المصاريف", icon: Table },
  { id: "dashboard", label: "التحليل", icon: LayoutDashboard },
  { id: "chat", label: "محادثة", icon: LayoutDashboard },
  { id: "analysis", label: "التقرير", icon: LayoutDashboard },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed right-0 top-0 h-screen w-56 bg-white border-l p-4">
      <h1 className="text-xl font-bold text-center">مصاريفي</h1>

      {navItem.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex mt-2 items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors
                     ${isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <Icon size={20} />
            <span> {item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
