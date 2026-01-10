import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import type { User } from "@/types/user";
import BlockList from "@/components/BlockList";
// @ts-ignore
import { MOCK_BLOCKED_USERS } from "@/MockData/data";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import AnimateEntrance from "./ui/AnimateEntrance";
import { userService } from "@/services/userService";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export default function EditProfile({ isOpen, onClose, currentUser }: EditProfileProps) {
  const [editName, setEditName] = useState(currentUser.full_name || currentUser.name || "");
  const [editBio, setEditBio] = useState(currentUser.bio || "");
  const [editLink, setEditLink] = useState(currentUser.link || "");
  const [isBlockListOpen, setIsBlockListOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"main" | "links" | "add-link">("main");
  const [tempLinkUrl, setTempLinkUrl] = useState("");
  const [tempLinkTitle, setTempLinkTitle] = useState("");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
  
    const toastId = "edit-profile";
  
    try {
      toast.loading("Updating profile...", { id: toastId });
  
      await userService.updateProfile({
        full_name: editName,
        bio: editBio,
        link: editLink, // Update link
      });
  
      toast.success("Profile updated successfully", {
        id: toastId,
      });
  
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
  
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
  
      toast.error("Failed to update profile", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      ></div>

      <AnimateEntrance
        type="zoom"
        duration="duration-200"
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="bg-secondary text-white border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header Dialog */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            {view === "main" && (
                <>
                <div className="flex flex-col">
                  <span className="font-semibold text-lg">{currentUser.full_name || currentUser.name || currentUser.username}</span>
                  <span className="text-sm text-neutral-500">@{currentUser.username}</span>
                </div>
                <Avatar className="w-10 h-10 border border-neutral-800">
                  <AvatarImage src={currentUser.avatar_url || currentUser.avatar || DEFAULT_AVATAR_URL} className="object-cover" />
                  <AvatarFallback>{(currentUser.username || "U")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                </>
            )}

            {view === "links" && (
                <div className="flex items-center gap-4 w-full">
                    <button onClick={() => setView("main")} className="p-1 hover:bg-white/10 rounded-full">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                    </button>
                    <span className="font-semibold text-lg">Links</span>
                </div>
            )}

            {view === "add-link" && (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView("links")} className="p-1 hover:bg-white/10 rounded-full">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                        </button>
                        <span className="font-semibold text-lg">Add link</span>
                    </div>
                     <button 
                        onClick={() => {
                            setEditLink(tempLinkUrl); 
                            setView("links");
                        }} 
                        className="text-blue-500 font-semibold text-[15px] disabled:opacity-50"
                        disabled={!tempLinkUrl}
                    >
                        Done
                    </button>
                </div>
            )}
          </div>

          <div className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            
            {view === "main" && (
                <>
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
                <div 
                    className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70"
                    onClick={() => setView("links")}
                >
                    <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-neutral-200">Link</span>
                        {editLink && <span className="text-sm text-neutral-500 truncate max-w-[200px]">{editLink}</span>}
                    </div>
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
                </>
            )}

            {view === "links" && (
                <div className="flex flex-col gap-4">
                     <div 
                        className="bg-hover border border-accent rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-800"
                        onClick={() => {
                            setTempLinkUrl(editLink || "");
                            setTempLinkTitle(""); // Reset or load title if we had it
                            setView("add-link");
                        }}
                    >
                        <span className="text-[15px] text-white">Add link</span>
                        <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-white text-lg leading-none">+</div>
                    </div>

                    {editLink && (
                        <div className="space-y-2">
                             <div className="bg-hover border border-accent rounded-xl p-4 flex items-start justify-between group relative cursor-pointer hover:bg-neutral-800"
                                onClick={() => {
                                    setTempLinkUrl(editLink);
                                    // Title is not stored currently, so we just allow editing the URL
                                    setView("add-link");
                                }}>
                                <div className="flex flex-col gap-1 overflow-hidden mr-10">
                                     <span className="text-[15px] text-white font-medium truncate">{editLink}</span>
                                     <span className="text-sm text-neutral-500 truncate">{editLink}</span>
                                </div>
                                
                                <button 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowRemoveConfirm(true);
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 hover:text-white"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {view === "add-link" && (
                <div className="flex flex-col gap-4">
                     <div className="space-y-2">
                        <label className="text-[15px] font-medium text-neutral-200">URL</label>
                        <input
                            type="text"
                            value={tempLinkUrl}
                            onChange={(e) => setTempLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full bg-hover border border-accent text-white focus:outline-none focus:border-neutral-600 h-12 rounded-xl px-4 text-[15px]"
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-[15px] font-medium text-neutral-200">Title (Optional)</label>
                        <input
                            type="text"
                            value={tempLinkTitle}
                            onChange={(e) => setTempLinkTitle(e.target.value)}
                            placeholder="My Website"
                            className="w-full bg-hover border border-accent text-white focus:outline-none focus:border-neutral-600 h-12 rounded-xl px-4 text-[15px]"
                        />
                    </div>
                </div>
            )}

          </div>

          {/* Remove Confirmation Dialog Overlay */}
            {showRemoveConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowRemoveConfirm(false)}>
                    <div className="bg-[#1e1e1e] border border-neutral-800 rounded-2xl w-full max-w-[280px] overflow-hidden shadow-2xl scale-100" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center space-y-2">
                             <h3 className="text-lg font-bold text-white">Remove link?</h3>
                             {/* <p className="text-sm text-neutral-400">This will remove the link from your profile.</p> */}
                        </div>
                        <div className="flex border-t border-neutral-800">
                             <button 
                                className="flex-1 py-3 text-[15px] font-medium text-white hover:bg-white/5 border-r border-neutral-800"
                                onClick={() => setShowRemoveConfirm(false)}
                             >
                                Cancel
                             </button>
                             <button 
                                className="flex-1 py-3 text-[15px] font-bold text-red-500 hover:bg-white/5"
                                onClick={() => {
                                    setEditLink("");
                                    setShowRemoveConfirm(false);
                                }}
                             >
                                Remove
                             </button>
                        </div>
                    </div>
                </div>
            )}

          {/* Footer Button - Only for Main View */}
          {view === "main" && (
             <div className="p-6 pt-0">
                <Button
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium h-10 rounded-xl text-[15px]"
                onClick={handleSave}
                disabled={isLoading}
                >
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                    </>
                ) : "Done"}
                </Button>
            </div>
          )}
          
          {/* Footer specific for Link views if needed? No, standard mobile pattern often has Done in header or just back */}
        </div>
      </AnimateEntrance>

      {/* Block List Dialog */}
      <BlockList
        isOpen={isBlockListOpen}
        onClose={() => setIsBlockListOpen(false)}
        // @ts-ignore
        blockedUsers={MOCK_BLOCKED_USERS}
      />
    </div>
  );
}
