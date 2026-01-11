import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { useBlockedUsers, useUnblockUser } from "@/hooks/api/use-users";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface BlockListProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BlockList({ isOpen, onClose }: BlockListProps) {
  const { data: blockedUsers, isLoading } = useBlockedUsers({ enabled: isOpen });
  const unblockMutation = useUnblockUser();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-[500px] bg-secondary text-white border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex flex-col">
            <h2 className="text-[20px] font-semibold text-red-500">Block List</h2>
            <span className="text-sm text-neutral-500">{blockedUsers?.length || 0} people blocked</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3 p-4 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8">
                <LoadingSpinner />
            </div>
          ) : blockedUsers && blockedUsers.length > 0 ? (
            blockedUsers.map((user) => (
            <div
              key={user.uid}
              className="flex items-center justify-between p-4 bg-[#1e293b]/20 border border-neutral-800 rounded-2xl hover:bg-[#1e293b]/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border border-neutral-800">
                  <AvatarImage src={user.avatar_url || DEFAULT_AVATAR_URL} />
                  <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {(user.full_name || user.username)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-[15px]">{user.full_name || user.username}</span>
                  <span className="text-sm text-neutral-500">@{user.username}</span>
                </div>
              </div>
              <Button
                onClick={() => unblockMutation.mutate(user.uid)}
                disabled={unblockMutation.isPending && unblockMutation.variables === user.uid}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold h-8 px-4 rounded-lg text-[13px] border border-neutral-700"
              >
                {unblockMutation.isPending && unblockMutation.variables === user.uid ? "Unblocking..." : "Unblock"}
              </Button>
            </div>
          ))
          ) : (
            <div className="p-8 text-center text-neutral-500">
                You haven't blocked anyone.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
