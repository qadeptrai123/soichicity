
import { Image as ImageIcon, AtSign, X, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
import type { User } from "@/types/user";
import { usePostEditor } from "@/hooks/usePostEditor";
import { useCreatePost } from "@/hooks/api/use-posts";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  mockFriends: User[];
}

export default function CreatePostDialog({
  open,
  onOpenChange,
  currentUser,
  mockFriends,
}: CreatePostDialogProps) {

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

  const createPostMutation = useCreatePost();

  const handleClose = () => {
    resetEditor();
    onOpenChange(false);
  };

  const handlePostSubmit = () => {
    // Basic validation
    if (!content.trim() && mediaFiles.length === 0) return;

    const formData = new FormData();
    formData.append("content", content);

    // Append files
    mediaFiles.forEach((media) => {
      if (media.file) {
        formData.append("files", media.file);
      }
    });

    // Note: If you want to handle specific media types or order, logic might be more complex
    // backend expects 'files' for all media.

    createPostMutation.mutate(formData, {
      onSuccess: () => {
        // Close and reset
        handleClose();
        // Maybe show toast? 
      },
      onError: (error) => {
        console.error("Failed to create post", error);
        // Handle error UI
      }
    });
  };

  const isDisabled = !content && mediaFiles.length === 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetEditor();
      onOpenChange(isOpen);
    }}>
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
              <AvatarImage src={currentUser.avatar_url} alt={currentUser.username} />
              <AvatarFallback>{(currentUser.full_name || currentUser.username).charAt(0).toUpperCase()}</AvatarFallback>
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
              autoFocus
            />

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2 mb-4 scrollbar-hide">
                {mediaFiles.map((item, index) => (
                  <div key={index} className="relative flex-shrink-0 max-w-[480px] rounded-xl overflow-hidden border border-border">
                    {item.type === "image" ? (
                      <img src={item.url} alt="Preview" className="max-h-64 w-auto object-contain bg-black/10" />
                    ) : (
                      <video src={item.url} className="max-h-64 w-auto object-contain bg-black/10" controls />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-full p-1 transition border border-white/20"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-auto relative mt-6! -ml-2!">
              <Button onClick={() => fileInputRef.current?.click()} className="text-text-secondary hover:text-foreground transition bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-white/5">
                <ImageIcon size={20} />
              </Button>
              <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

              {/* Tag User Dropdown */}
              <DropdownMenu onOpenChange={(isOpen) => !isOpen && setTagSearch("")}>
                <DropdownMenuTrigger asChild>
                  <Button className="text-text-secondary hover:text-foreground transition bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-white/5 outline-none">
                    <AtSign size={20} />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="bg-secondary border-border text-foreground w-64 max-h-[280px] overflow-y-auto no-scrollbar p-0"
                  align="start"
                >
                  <div className="sticky top-0 bg-secondary/95 backdrop-blur-sm p-2 z-10 border-b border-white/10">
                    <div className="relative flex items-center">
                      <Search className="absolute left-2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search friends..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-black/20 text-sm text-foreground rounded-md py-1.5 pl-8 pr-2 outline-none border border-transparent focus:border-white/20 placeholder:text-muted-foreground/50"
                        autoFocus={false}
                      />
                    </div>
                  </div>

                  <div className="p-1">
                    {filteredFriends.length > 0 ? (
                      filteredFriends.map((user) => (
                        <DropdownMenuItem
                          key={user.uid}
                          onClick={() => handleTagUser(user.username)}
                          className="cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2 py-2 px-2 rounded-md"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px] bg-primary/20">{(user.full_name || user.username).charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none">{user.full_name || user.username}</span>
                            <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <EmojiButton onSelect={onEmojiClick} />
            </div>
          </div>
        </div>
        {/* FOOTER */}
        <DialogFooter className="p-6 pt-2 flex justify-end border-t border-border sm:justify-end">
          <Button
            onClick={handlePostSubmit}
            disabled={isDisabled || createPostMutation.isPending}
            className={`rounded-full font-semibold px-8 py-2 h-auto text-base transition-all border-none ${isDisabled ? "bg-primary/50 text-white/50 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-blue-500/20"}`}
          >
            {createPostMutation.isPending ? "Posting..." : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
