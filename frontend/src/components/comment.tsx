import { useState } from "react";
import { Image as ImageIcon, AtSign, X, Search, Send } from "lucide-react";

// import type { MediaItem } from "@/types/common";
import FeedCard from "./FeedCard";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import EmojiButton from "./EmojiButton";
import { useCreatePost } from "@/hooks/api/use-posts";
import type { User } from "@/types/user";
import { usePostEditor } from "@/hooks/usePostEditor";

export type TargetPost = {
  id: string | number;
  user: {
    uid: string;
    username: string;
    full_name: string | null;
    avatar_url?: string;
  };
  content: string;
  date: string;
  media_url?: string | null;
  media_type?: string | null;
  gallery?: string[];
  level?: number;
};

// Add useQueryClient import
import { useQueryClient } from "@tanstack/react-query";

interface ReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  targetPost: TargetPost;
  mockFriends: User[];
  rootId?: string; // New prop
}

export default function ReplyCommentDialog({
  open,
  onOpenChange,
  currentUser,
  targetPost,
  mockFriends,
  rootId
}: ReplyDialogProps) {

  const createPost = useCreatePost();
  const queryClient = useQueryClient(); // Initialize queryClient
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    resetEditor,
    onEmojiClick,
    handleTagUser,
  } = usePostEditor({ mockFriends });


  const handlePostSubmit = async () => {
    setIsSubmitting(true);
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

    // Add hierarchy fields
    const parentLevel = targetPost.level ?? 0;
    formData.append("level", String(parentLevel + 1));
    formData.append("reply_to_id", String(targetPost.id));

    createPost.mutate(
      formData,
      {
        onSuccess: () => {
          setIsSubmitting(false);
          resetEditor();
          onOpenChange(false);
          if (rootId) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["post", rootId] });
            }, 500);
          }
        },
        onError: () => {
          setIsSubmitting(false);
        }
      }
    );
  };

  // Nếu chưa có targetPost thì không hiển thị gì (đề phòng lỗi)
  if (!targetPost) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetEditor();
      onOpenChange(isOpen);
    }}>
      <DialogContent
        className="sm:max-w-[600px] bg-secondary border-border p-0 shadow-2xl gap-0 overflow-visible [&>button]:hidden max-h-[90vh] flex rounded-t-3xl rounded-b-none flex-col fixed top-auto bottom-0 left-[50%] translate-x-[-50%] translate-y-0 mb-0 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
      >
        {/* --- 1. HANDLE BAR (Thanh gạch ngang trên cùng) --- */}
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
              <AvatarImage src={currentUser.avatar_url} alt={currentUser.username} />
              <AvatarFallback>{(currentUser.full_name || currentUser.username).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center justify-between w-full">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Reply to ${targetPost.user.username}...`}
                  className="w-full bg-transparent border-none text-foreground placeholder:text-text-secondary focus:ring-0 resize-none text-[15px] outline-none p-2 min-h-[40px] leading-relaxed overflow-hidden"
                  style={{ height: content ? 'auto' : '60px' }}
                  autoFocus
                />

                <div className="flex items-center gap-1 ml-2 text-text-secondary">
                  <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

                  <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:text-foreground hover:bg-white/5 rounded-full transition outline-none">
                    <ImageIcon size={20} />
                  </button>

                  <DropdownMenu onOpenChange={(isOpen) => !isOpen && setTagSearch("")}>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:text-foreground hover:bg-white/5 rounded-full transition outline-none">
                        <AtSign size={20} />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="bg-secondary border-border text-foreground w-64 p-0" align="end">
                      <div className="p-2 border-b border-border">
                        <div className="flex items-center bg-black/20 rounded-md px-2 border border-transparent focus-within:border-white/10">
                          <Search size={14} className="text-text-secondary" />
                          <input
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            placeholder="Search..."
                            className="bg-transparent border-none text-sm p-2 w-full outline-none text-foreground placeholder:text-text-secondary"
                          />
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                        {filteredFriends.map(u => (
                          <DropdownMenuItem key={u.uid} onClick={() => handleTagUser(u.username)} className="hover:bg-white/10 cursor-pointer text-foreground focus:bg-white/10 focus:text-foreground">
                            {u.username}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative">
                    <EmojiButton onSelect={onEmojiClick} />
                  </div>
                </div>
              </div>
              {mediaFiles.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2 mt-2 no-scrollbar">
                  {mediaFiles.map((item, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden border border-border flex-shrink-0 group">
                      <img src={item.url} className="w-full h-full object-cover" alt="preview" />
                      <button onClick={() => removeMedia(index)} className="absolute top-0 right-0 bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full bg-border opacity-50 my-0"></div>

        <div className="px-0 py-0 flex-1 overflow-y-auto min-h-[150px]">
          <FeedCard
            post={{
              post_id: String(targetPost.id),
              content: targetPost.content,
              created_at: targetPost.date,
              author_id: targetPost.user.uid,
              media_url: targetPost.media_url,
              media_type: targetPost.media_type,
              gallery: targetPost.gallery,
              // Mặc định các giá trị đếm = 0 vì đây là post gốc
              likes_count: 0,
              comments_count: 0,
              saves_count: 0,
              reposts_count: 0,
              shares_count: 0,
            }}
            author={{
              id: targetPost.user.uid,
              uid: targetPost.user.uid,
              name: targetPost.user.full_name || targetPost.user.username,
              username: targetPost.user.username,
              handle: `@${targetPost.user.username}`,
              avatar: targetPost.user.avatar_url || "",
            }}
            className="mb-0 border-none shadow-none bg-transparent hover:bg-transparent hover:shadow-none cursor-default"
            compact={true}
          />
        </div>


        {/* --- FOOTER ---*/}
        <div className="p-4! pt-2 pb-8 flex justify-center border-t border-border bg-secondary">
          <Button
            onClick={handlePostSubmit}
            disabled={(!content && mediaFiles.length === 0) || isSubmitting}
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