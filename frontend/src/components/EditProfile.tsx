import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import type { User } from "@/MockData/type";
import BlockList from "@/components/BlockList";
import { MOCK_BLOCKED_USERS } from "@/MockData/data";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export default function EditProfile({ isOpen, onClose, currentUser }: EditProfileProps) {
  const [editName, setEditName] = useState(currentUser.name || "");
  const [editBio, setEditBio] = useState("");
  const [isBlockListOpen, setIsBlockListOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Lớp nền */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      ></div>

      <div className="relative z-10 w-full max-w-[400px] bg-secondary text-white border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Dialog */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            <span className="font-semibold text-lg">{currentUser.name || currentUser.username}</span>
            <span className="text-sm text-neutral-500">@{currentUser.username}</span>
          </div>
          <Avatar className="w-10 h-10 border border-neutral-800">
            <AvatarImage src={currentUser.avatar_url || currentUser.avatarUrl || DEFAULT_AVATAR_URL} className="object-cover" />
            <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
          </Avatar>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-neutral-200">Name</label>
            <div className="relative">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-hover border border-accent text-white focus:outline-none focus:border-neutral-600 h-12 rounded-xl px-4 text-[15px]"
              />
            </div>
          </div>

          <div className="h-[1px] bg-border-accent w-full"></div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-neutral-200">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="+ Write bio"
              className="w-full bg-hover border border-[#2A2F3E] text-white placeholder:text-neutral-500 p-3 h-14 rounded-xl resize-none focus:outline-none focus:border-neutral-600 text-[15px]"
            />
          </div>

          {/* List Settings */}
          <div className="flex flex-col gap-1">
            <div className="h-[1px] bg-border-accent w-full mb-1"></div>
            {/* Link */}
            <div className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70">
              <span className="text-[15px] font-medium text-neutral-200">Link</span>
              <ChevronRight size={20} className="text-neutral-600" />
            </div>
            <div className="h-[1px] bg-border-accent w-full my-1"></div>

            {/* Block List */}
            <div
              className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70"
              onClick={() => setIsBlockListOpen(true)}
            >
              <span className="text-[15px] font-medium text-red-500">Block List</span>
              <ChevronRight size={20} className="text-neutral-600" />
            </div>
            <div className="h-[1px] bg-border-accent w-full mt-1"></div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-6 pt-0">
          <Button
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium h-10 rounded-xl text-[15px]"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>

      {/* Block List Dialog */}
      <BlockList
        isOpen={isBlockListOpen}
        onClose={() => setIsBlockListOpen(false)}
        blockedUsers={MOCK_BLOCKED_USERS as unknown as User[]}
      />
    </div>
  );
}
