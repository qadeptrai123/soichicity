
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { usePostEditor } from "@/lib/usePostEditor";
import { MediaPreview, PostEditorActions } from "./PostEditorShared";

type MediaFile = { url: string; type: "image" | "video" };

type User = {
  id: string | number;
  username: string;
  name: string | null;
  avatarUrl?: string;
};
interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User; // Nhận dữ liệu người dùng qua props
  mockFriends: User[];
  onPost: (content: string, mediaFiles: MediaFile[]) => void;
}

export default function CreatePostDialog({
  open,
  onOpenChange,
  currentUser,
  mockFriends,
  onPost,
}: CreatePostDialogProps) {

  // Use shared hook for post editor logic
  const {
    content,
    setContent,
    mediaFiles,
    tagSearch,
    setTagSearch,
    fileInputRef,
    filteredFriends,
    handleFileUpload,
    removeMedia,
    handleReset,
    onEmojiClick,
    handleTagUser,
  } = usePostEditor({ mockFriends });

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handlePost = () => {
    onPost(content, mediaFiles);
    handleReset();
  };

  const isDisabled = !content && mediaFiles.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-secondary border-border p-0 shadow-2xl gap-0 overflow-visible [&>button]:hidden max-h-[90vh] flex flex-col -mt-9">

        {/* HEADER */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border space-y-0">
          <button
            onClick={handleClose}
            className="text-text-secondary hover:text-foreground text-base bg-transparent border-none cursor-pointer p-0 font-normal transition-colors"
          >
            Cancel
          </button>
          <DialogTitle className="text-base font-bold text-foreground m-0">New Post</DialogTitle>
          <div className="w-[50px]"></div>
        </DialogHeader>

        {/* CONTENT */}
        <div className="p-6 flex gap-4 min-h-[300px] overflow-y-auto flex-1">
          <div className="flex flex-col items-center pt-1">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} />
              <AvatarFallback>{(currentUser.name || currentUser.username)}</AvatarFallback>
            </Avatar>
            <div className="w-[2px] flex-1 bg-border my-3 rounded-full opacity-50"></div>
          </div>

          <div className="flex-1 flex flex-col">
            <p className="font-semibold text-base mb-1 text-foreground">
              {currentUser.username}
            </p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's new?"
              className="w-full bg-transparent border-none text-foreground placeholder-text-muted focus:ring-0 resize-none text-base outline-none p-0 min-h-[120px] leading-relaxed mb-4"
            />

            {/* Media Preview */}
            <MediaPreview 
              mediaFiles={mediaFiles} 
              onRemove={removeMedia} 
              variant="default"
            />

            {/* Action Buttons */}
            <PostEditorActions
              fileInputRef={fileInputRef}
              tagSearch={tagSearch}
              setTagSearch={setTagSearch}
              filteredFriends={filteredFriends}
              onFileUpload={handleFileUpload}
              onTagUser={handleTagUser}
              onEmojiClick={onEmojiClick}
              variant="inline"
            />
          </div>
        </div>
        {/* FOOTER */}
        <DialogFooter className="p-6 pt-2 flex justify-end border-t border-border sm:justify-end">
          <Button
            onClick={handlePost}
            disabled={isDisabled}
            className={`rounded-full font-semibold px-8 py-2 h-auto text-base transition-all border-none ${isDisabled ? "bg-primary/50 text-white/50 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-blue-500/20"}`}
          >
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
