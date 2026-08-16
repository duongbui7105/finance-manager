/* eslint-disable no-unused-vars */
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight,
         BarChart2, Bot, User, Wallet, Zap } from "lucide-react";

const links = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"    },
  { to: "/transactions", icon: ArrowLeftRight,  label: "Giao dịch"    },
  { to: "/reports",      icon: BarChart2,       label: "Báo cáo"      },
  { to: "/smart-input",  icon: Zap,             label: "Nhập thông minh" }, 
  { to: "/ai",           icon: Bot,             label: "AI Chat"      },
  { to: "/profile",      icon: User,            label: "Hồ sơ"        },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r flex flex-col shrink-0">
      {/* logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="bg-primary-600 p-1.5 rounded-lg">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">FinManager</span>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
               transition-colors duration-150
               ${isActive
                 ? "bg-primary-50 text-primary-700"
                 : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
            }>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* footer */}
      <div className="px-6 py-4 border-t">
        <p className="text-xs text-gray-400">Finance Manager v1.0</p>
      </div>
    </aside>
  );
}