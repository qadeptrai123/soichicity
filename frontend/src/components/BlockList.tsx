import { useState } from "react";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@/MockData/type";

interface BlockListProps {
  isOpen: boolean;
  onClose: () => void;
  blockedUsers: User[];
}

export default function BlockList({ isOpen, onClose, blockedUsers }: BlockListProps) {
  const [users, setUsers] = useState<User[]>(blockedUsers);

  const handleUnblock = (userId: string | number) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/10" 
        onClick={onClose}
      ></div>
      
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-[500px] bg-secondary text-white border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            <h2 className="text-[20px] font-semibold text-red-500">Block List</h2>
            <span className="text-sm text-neutral-500">{users.length} people blocked</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3 p-4 max-h-[500px] overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-6 py-4 bg-secondary border border-accent rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border border-neutral-800">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-500">
                    {(user.name || user.username)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-[15px]">{user.name || user.username}</span>
                  <span className="text-sm text-neutral-500">@{user.username}</span>
                </div>
              </div>
              <Button
                onClick={() => handleUnblock(user.id)}
                className="bg-accent hover:bg-red-600 text-white font-medium h-9 px-6 rounded-lg text-[14px] transition-colors"
              >
                Unblock
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
