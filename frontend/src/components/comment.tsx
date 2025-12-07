import React, { useState, useRef } from "react";
import { Image as ImageIcon, AtSign, X, Search, Send } from "lucide-react"; 
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



type MediaFile = { url: string; type: "image" | "video" };

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
  
  const [content, setContent] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [tagSearch, setTagSearch] = useState<string>(""); 
  const fileInputRef = useRef<HTMLInputElement>(null);

//   const createComment = useCreateComment();

  const filteredFriends = mockFriends.filter((user) => {
    const query = tagSearch.toLowerCase();
    const matchName = user.name ? user.name.toLowerCase().includes(query) : false;
    const matchUsername = user.username.toLowerCase().includes(query);
    return matchName || matchUsername;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: MediaFile[] = Array.from(e.target.files).map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeMedia = (indexToRemove: number) => {
    setMediaFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleReset = () => {
    setContent("");
    setMediaFiles([]);
    setTagSearch(""); 
  };

  const handlePost = () => {
    onPost(content, mediaFiles);
    handleReset();
    onOpenChange(false);
  };

//   const handlePost = async () => {
//   createComment.mutate({
//     thread_id: targetPost.id,
//     content: content,
//     media: mediaFiles
//   });

//   handleReset();
//   onOpenChange(false);
// };

  const onEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const handleTagUser = (username: string) => {
    setContent((prev) => prev + `@${username} `);
    setTagSearch("");
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
                             <Search size={14} className="text-text-secondary"/>
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
                          <DropdownMenuItem key={u.id} onClick={() => handleTagUser(u.username)} className="hover:bg-white/10 cursor-pointer text-foreground focus:bg-white/10 focus:text-foreground">
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
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
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