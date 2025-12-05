import {
  Home,
  Search,
  Heart,
  Users,
  PlusSquare,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const items = [
  { icon: Home, path: "/" },
  { icon: Search, path: "/search" },
  { icon: Heart, path: "/favorites" },
  { icon: Users, path: "/community" },
  { icon: PlusSquare, path: "/create" },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <div className="absolute z-10000 fixed top-0 left-0 w-20 h-screen bg-backgroundfeed border-r border-[#1F2937] flex flex-col justify-between py-6">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-8">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center"></div>

        {/* Menu */}
        <div className="flex flex-col items-center gap-8">
          {items.map((item, index) => {
            const Icon = item.icon;
            const active = pathname === item.path;

            return (
              <Link
                key={index}
                to={item.path}
                className={`p-3 rounded-xl transition ${active
                  ? "bg-[#17212b] text-white"
                  : "text-gray-400 hover:bg-[#1a222e] hover:text-white"
                  } ${item.icon === PlusSquare ? "mt-32" : ""}`}   // ⬅️ Thêm dòng này
              >
                <Icon size={24} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      {/* Logout */}
      <div className="flex justify-center">
        <button className="p-3 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-500 transition">
          <LogOut size={24} />
        </button>
      </div>

    </div>
  );
}
