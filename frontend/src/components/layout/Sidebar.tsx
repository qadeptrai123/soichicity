import {
  Home,
  Search,
  Heart,
  Users,
  PlusSquare,
  LogOut,
  X,
  LogIn,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import CreatePostDialog from "@/components/CreatePostDialog";
import { SearchDialog } from "@/components/SearchDialog";
import { useState } from "react";
import { MOCK_FRIENDS } from "@/MockData/data";
import logo from "@/assets/logo.svg";



export default function Sidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [openCreatePostDialog, setOpenCreatePostDialog] = useState(false);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);

  const items = [
    { icon: Home, path: "/" },
    { icon: Search, path: "/search" },
    { icon: Heart, path: "/activities" },
    // { icon: Users, path: "/community" },
    { icon: Users, path: `/profile/${user?.username}` },
    { icon: PlusSquare, path: "/create" },
  ];

  const handleItemClick = (path: string, icon: any) => {
    if (icon === PlusSquare) {
      setOpenCreatePostDialog(true);
    } else if (icon === Search) {
      setOpenSearchDialog(true);
    } else {
      navigate(path);
      onOpenChange(false); // Close sidebar on mobile after navigation
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      <div className={`fixed top-0 left-0 z-29 w-20 h-screen bg-backgroundfeed backdrop-blur-md border-r border-[#1F2937] flex flex-col justify-between py-6 transition-transform duration-300 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
        {/* Top Section */}
        <div className="flex flex-col items-center gap-8">
          {/* Close Button for Mobile */}
          <div className="flex justify-center md:hidden">
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Logout / Login */}
          <div className="flex justify-center md:hidden">
            {isAuthenticated ? (
              <button
                className="p-3 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-500 transition"
                onClick={logout}
              >
                <LogOut size={24} />
              </button>
            ) : (
              <button
                className="p-3 rounded-xl text-blue-400 hover:bg-blue-500/20 hover:text-blue-500 transition"
                onClick={() => {
                  navigate("/login");
                  onOpenChange(false);
                }}
              >
                <LogIn size={24} />
              </button>
            )}
          </div>

          {/* Logo */}
          <div className="flex justify-center">
            <img src={logo} alt="Sợi Chỉ City" className="w-10 h-10 rounded-full" />
          </div>

          {/* Menu */}
          <div className="flex flex-col items-center gap-8">
            {items.map((item, index) => {
              const Icon = item.icon;
              const active = pathname === item.path && item.icon !== Search;

              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item.path, item.icon)}
                  className={`p-3 rounded-xl transition ${active
                    ? "bg-[#17212b] text-white"
                    : "text-gray-400 hover:bg-[#1a222e] hover:text-white"
                    } ${item.icon === PlusSquare ? "mt-32" : ""}`}
                >
                  <Icon size={24} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout for Desktop (Bottom) */}
        <div className="hidden md:flex justify-center">
          {isAuthenticated && (
            <button
              className="p-3 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-500 transition"
              onClick={logout}
            >
              <LogOut size={24} />
            </button>
          )}
        </div>

        {user && (
          <CreatePostDialog
            open={openCreatePostDialog}
            onOpenChange={setOpenCreatePostDialog}
            currentUser={user}
            mockFriends={MOCK_FRIENDS}
          />
        )}

        <SearchDialog
          open={openSearchDialog}
          onOpenChange={setOpenSearchDialog}
        />

      </div>
    </>
  );
}
