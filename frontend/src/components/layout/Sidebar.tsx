import {
  Home,
  Search,
  Heart,
  Users,
  PlusSquare,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import CreatePostDialog from "@/components/CreatePostDialog";
import { useState } from "react";

const items = [
  { icon: Home, path: "/" },
  { icon: Search, path: "/search" },
  { icon: Heart, path: "/favorites" },
  { icon: Users, path: "/community" },
  { icon: PlusSquare, path: "/create" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  // console.log(user)
  const [openCreatePostDialog, setOpenCreatePostDialog] = useState(false);

  const mockFriends = [
    { id: 1, username: "johndoe", name: "John Doe", avatarUrl: "https://i.pravatar.cc/150?u=1" },
    { id: 2, username: "janedoe", name: "Jane Doe", avatarUrl: "https://i.pravatar.cc/150?u=2" },
    { id: 3, username: "bobsmith", name: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=3" },
  ];

  const handlePost = (content: string, mediaFiles: any[]) => {
    console.log("Posting:", content, mediaFiles);
    setOpenCreatePostDialog(false);
  };

  const handleItemClick = (path: string, isCreate: boolean) => {
    if (isCreate) {
      setOpenCreatePostDialog(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="fixed top-0 left-0 z-40 w-20 h-screen bg-backgroundfeed backdrop-blur-md border-r border-[#1F2937] flex flex-col justify-between py-6">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-8">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center"></div>

        {/* Menu */}
        <div className="flex flex-col items-center gap-8">
          {items.map((item, index) => {
            const Icon = item.icon;
            const active = pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => handleItemClick(item.path, item.icon === PlusSquare)}
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

      {/* Logout */}
      {/* Logout */}
      <div className="flex justify-center">
        <button className="p-3 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-500 transition"
          onClick={logout}
        >
          <LogOut size={24} />
        </button>
      </div>

      {user && (
        <CreatePostDialog
          open={openCreatePostDialog}
          onOpenChange={setOpenCreatePostDialog}
          currentUser={user}
          mockFriends={mockFriends}
          onPost={handlePost}
        />
      )}

    </div>
  );
}
