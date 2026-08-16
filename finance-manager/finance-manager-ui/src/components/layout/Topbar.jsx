import useAuth from "../../hooks/useAuth";
import { LogOut, Bell } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b flex items-center
                        justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-3">
        {/* notification bell placeholder */}
        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600
                            hover:bg-gray-50 transition-colors">
          <Bell className="h-5 w-5" />
        </button>

        {/* user info */}
        <div className="flex items-center gap-2 pl-3 border-l">
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center
                          justify-center text-white text-sm font-semibold">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
            {user?.email}
          </span>
        </div>

        {/* logout */}
        <button onClick={logout}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500
                      hover:bg-red-50 transition-colors"
          title="Đăng xuất">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}