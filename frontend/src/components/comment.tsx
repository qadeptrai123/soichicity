import React from "react";
import { Send } from "lucide-react"; 
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAddComment } from "@/hooks/api/use-posts";
import { usePostEditor } from "@/lib/usePostEditor";
import { MediaPreview, PostEditorActions } from "./PostEditorShared";


type MediaFile = { url: string; type: "image" | "video"; file: File;};

type User = {
  id: string | number;
  username: string;
  name: string | null;
  avatarUrl?: string;
};

export type TargetPost = {
  id: string | number;
  user: User;
  content: string;
  date: string;
};

interface ReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  targetPost: TargetPost; // Nhận dữ liệu bài viết cần reply từ props
  mockFriends: User[]; 
  onPost: (content: string, mediaFiles: MediaFile[]) => void;
}

export default function ReplyCommentDialog({ 
  open, 
  onOpenChange,
  currentUser, 
  targetPost, 
  mockFriends, 
  onPost, 
}: ReplyDialogProps) {
  
  const addComment = useAddComment();
  
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

  const handlePost = async () => {
    const formData = new FormData();
    formData.append("content", content);

    if (mediaFiles.length > 0) {
      const blobs = await Promise.all(
        mediaFiles.map(item =>
          fetch(item.url)
            .then(res => res.blob())
            .then(blob => new File([blob], "media", { type: blob.type }))
        )
      );

      blobs.forEach(file => formData.append("files", file));
    }

    addComment.mutate(
      { postId: String(targetPost.id), data: formData },
      {
        onSuccess: () => {
          handleReset();
          onOpenChange(false);
        }
      }
    );
  };

  // Nếu chưa có targetPost thì không hiển thị gì (đề phòng lỗi)
  if (!targetPost) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px] bg-secondary border-border p-0 shadow-2xl gap-0 overflow-visible [&>button]:hidden max-h-[90vh] flex rounded-t-3xl rounded-b-none flex-col fixed top-auto bottom-0 left-[50%] translate-x-[-50%] translate-y-0 mb-0 duration-300"
        onInteractOutside={(e) => e.preventDefault()} 
      >
        
        {/* --- 1. HANDLE BAR (Thanh gạch ngang trên cùng) --- */}
        {/* <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full opacity-50"></div>
        </div> */}
        <div 
          className="w-full flex justify-center pt-3 pb-1 cursor-pointer group"
          onClick={() => onOpenChange(false)}
          title="Close"
        >
          <div className="w-10 h-1 bg-border rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <div className="p-6 pb-1">
          <div className="flex gap-1! items-start">
            <Avatar className="w-10 h-10 border border-border mt-1">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} />
              <AvatarFallback>{(currentUser.name || currentUser.username).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center justify-between w-full">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Reply to ${targetPost.user.username}...`}
                  className="w-full bg-transparent border-none text-foreground placeholder:text-text-secondary focus:ring-0 resize-none text-[15px] outline-none p-2 min-h-[40px] leading-relaxed overflow-hidden"
                  style={{ height: content ? 'auto' : '60px' }}
                />

                <PostEditorActions
                  fileInputRef={fileInputRef}
                  tagSearch={tagSearch}
                  setTagSearch={setTagSearch}
                  filteredFriends={filteredFriends}
                  onFileUpload={handleFileUpload}
                  onTagUser={handleTagUser}
                  onEmojiClick={onEmojiClick}
                />
              </div>
              
              <MediaPreview 
                mediaFiles={mediaFiles} 
                onRemove={removeMedia} 
                variant="compact"
              />
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full bg-border opacity-50 my-0"></div>

        <div className="px-6 py-6 flex-1 overflow-y-auto min-h-[150px]">
          <div className="flex gap-4">
            {/* Avatar Target User */}
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={targetPost.user.avatarUrl} />
              <AvatarFallback>{(targetPost.user.name || targetPost.user.username).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-[15px] text-foreground">
                  {targetPost.user.name || targetPost.user.username}
                </span>
                <span className="text-sm text-text-secondary font-normal">
                  @{targetPost.user.username}
                </span>
                <span className="text-sm text-text-secondary font-normal">
                  {targetPost.date}
                </span>
              </div>

              {/* Content */}
              <p className="text-[15px] text-foreground/90 leading-relaxed font-light">
                {targetPost.content}
              </p>
            </div>
          </div>
        </div>

        {/* --- FOOTER ---*/}
        <div className="p-4! pt-2 pb-8 flex justify-center border-t border-border bg-secondary">
           <Button
            onClick={handlePost}
            disabled={!content && mediaFiles.length === 0}
            className={`bg-primary hover:bg-primary-hover text-white rounded-full px-6! py-6 text-base font-medium flex items-center gap-1! min-w-[130px] justify-center transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
           >
             <Send size={18} className="mr-1" />
             Reply
           </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}