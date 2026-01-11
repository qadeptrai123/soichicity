import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronRight, Loader2 } from "lucide-react";
import type { User } from "@/types/user";
import BlockList from "@/components/BlockList";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
// import AnimateEntrance from "./ui/AnimateEntrance";
import { userService } from "@/services/userService";
import { api } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";


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
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Avatar State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEditName(currentUser.full_name || currentUser.name || "");
      setEditBio(currentUser.bio || "");
      setEditLink(currentUser.link || "");
      setView("main");
      setShowRemoveConfirm(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [isOpen, currentUser]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    }
  }, [avatarPreview]);

  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    const toastId = "edit-profile";

    try {
      toast.loading("Updating profile...", { id: toastId });

      let newAvatarUrl = currentUser.avatar_url;

      // Upload Avatar if changed
      if (avatarFile) {
        try {
          // We need to import api from services/api, assuming I added uploadMedia there
          const res = await api.media.uploadMedia(avatarFile);
          newAvatarUrl = res.url;
        } catch (uploadError) {
          console.error("Avatar upload failed", uploadError);
          toast.error("Failed to upload avatar, saving other changes...");
          // proceed to save other changes or abort? 
          // Let's proceed but warn
        }
      }

      const updatedUser = await userService.updateProfile({
        full_name: editName,
        bio: editBio,
        link: editLink,
        avatar_url: newAvatarUrl
      });

      toast.success("Profile updated successfully", {
        id: toastId,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-reposts"] });
      
      await refreshUser(updatedUser);

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
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="sm:max-w-[400px] p-0 gap-0 bg-secondary border-neutral-800 text-white overflow-hidden [&>button]:hidden"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header Dialog */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            {view === "main" && (
              <>
                <div className="flex flex-col">
                  <span className="font-semibold text-lg">{currentUser.full_name || currentUser.name}</span>
                  <span className="text-[15px] text-neutral-500">{currentUser.username}</span>
                </div>
                <div onClick={handleAvatarClick} className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="w-12 h-12 border border-neutral-800">
                    <AvatarImage src={avatarPreview || currentUser.avatar_url || currentUser.avatar || DEFAULT_AVATAR_URL} className="object-cover" />
                    <AvatarFallback>{(currentUser.username || "U")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-blue-500 font-medium">Edit</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </>
            )}

            {view === "links" && (
              <div className="flex items-center gap-4 w-full">
                <button onClick={() => setView("main")} className="p-1 hover:bg-white/10 rounded-full">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                </button>
                <span className="font-semibold text-lg">Links</span>
              </div>
            )}

            {view === "add-link" && (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView("links")} className="p-1 hover:bg-white/10 rounded-full">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
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
                <div className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-[15px] font-medium text-neutral-200">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-hover border border-[#2A2F3E] text-white focus:outline-none focus:border-neutral-600 h-12 rounded-xl px-4 text-[15px]"
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
                {!editLink && (
                  <div
                    className="bg-hover border border-accent rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-800"
                    onClick={() => {
                      setTempLinkUrl(editLink || "");
                      setView("add-link");
                    }}
                  >
                    <span className="text-[15px] text-white">Add link</span>
                    <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-white text-lg leading-none">+</div>
                  </div>
                )}

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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 hover:text-white"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
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
              </div>
            )}

          </div>

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
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="sm:max-w-[320px] p-0 gap-0 overflow-hidden bg-secondary border-border text-white"
        >
          <div className="flex flex-col items-center gap-4 text-center p-8 pb-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-center text-xl font-bold">Remove link?</DialogTitle>
              <DialogDescription className="sr-only">
                Are you sure you want to remove this link?
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex w-full border-t border-border">
            <Button
              variant="ghost"
              className="flex-1 h-12 rounded-none border-r border-border text-white hover:bg-white/5 hover:text-white font-normal text-base"
              onClick={() => setShowRemoveConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 h-12 rounded-none text-red-500 hover:bg-white/5 hover:text-red-500 font-bold text-base"
              onClick={() => {
                setEditLink("");
                setShowRemoveConfirm(false);
              }}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BlockList
        isOpen={isBlockListOpen}
        onClose={() => setIsBlockListOpen(false)}
      />
    </>
  );
}
