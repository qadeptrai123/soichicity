import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  AtSign,
  X
} from "lucide-react";
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

type MediaFile = { url: string; type: "image" | "video" };

const MOCK_USERS = [
  { id: 1, name: "Alice", username: "alice123" },
  { id: 2, name: "Bob", username: "bob_builder" },
  { id: 3, name: "Charlie", username: "charlie_brown" },
  { id: 4, name: "David", username: "david_beckham" },
  { id: 5, name: "Eve", username: "eve_polastri" },
];

export default function CreatePostDialog() {
  const [content, setContent] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC ---
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

  };

  const handlePost = () => {
    console.log("Posting:", { content, mediaFiles });
    handleReset();
  };

  const onEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);

  };

  const handleTagUser = (username: string) => {
    setContent((prev) => prev + `@${username} `);
  };

  const isDisabled = !content && mediaFiles.length === 0;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[600px] bg-secondary border-border p-0 shadow-2xl gap-0 overflow-visible [&>button]:hidden max-h-[90vh] flex flex-col -mt-9" >

        {/* HEADER */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border space-y-0">
          <button
            onClick={handleReset}
            className="text-text-secondary hover:text-foreground text-base bg-transparent border-none cursor-pointer p-0 font-normal transition-colors"
          >
            Cancel
          </button>
          <DialogTitle className="text-base font-bold text-foreground m-0">New Post</DialogTitle>
          <div className="w-[50px]"></div> {/* Spacer to balance "Cancel" */}
        </DialogHeader>

        {/* CONTENT */}
        <div className="p-6 flex gap-4 min-h-[300px] overflow-y-auto flex-1">
          {/* Left: Avatar & Line */}
          <div className="flex flex-col items-center pt-1">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="w-[2px] flex-1 bg-border my-3 rounded-full opacity-50"></div>
          </div>

          {/* Right: Input & Media */}
          <div className="flex-1 flex flex-col">
            <p className="font-semibold text-base mb-1 text-foreground">lemaihoaibao</p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's new?"
              className="w-full bg-transparent border-none text-foreground placeholder-text-muted focus:ring-0 resize-none text-base outline-none p-0 min-h-[120px] leading-relaxed mb-4"
            />

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2 mb-4 scrollbar-hide">
                {mediaFiles.map((item, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 max-w-[480px] rounded-xl overflow-hidden border border-border"
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt="Preview"
                        className="max-h-64 w-auto object-contain bg-black/10"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="max-h-64 w-auto object-contain bg-black/10"
                        controls
                      />
                    )}

                    {/* Nút xoá ảnh/video */}
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
              {/* Image Upload */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="text-text-secondary hover:text-foreground transition bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-white/5"
              >
                <ImageIcon size={20} />
              </Button>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />

              {/* Tag User */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="text-text-secondary hover:text-foreground transition bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-white/5 outline-none">
                    <AtSign size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-secondary border-border text-foreground w-56">
                  {MOCK_USERS.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => handleTagUser(user.username)}
                      className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                    >
                      <span>{user.name}</span>
                      <span className="ml-auto text-xs text-text-muted">@{user.username}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Emoji Picker */}
              <EmojiButton onSelect={onEmojiClick} />
            </div>
          </div>
        </div>
        {/* FOOTER */}
        <DialogFooter className="p-6 pt-2 flex justify-end border-t border-border sm:justify-end">
          <Button
            onClick={handlePost}
            disabled={isDisabled}
            className={`rounded-full font-semibold px-8 py-2 h-auto text-base transition-all border-none ${isDisabled
              ? "bg-primary/50 text-white/50 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-blue-500/20"
              }`}
          >
            Post
          </Button>
        </DialogFooter>
      </DialogContent >
    </Dialog >
  );
}




