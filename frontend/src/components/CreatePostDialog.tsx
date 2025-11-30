import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  AtSign,
  Smile,
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
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
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
    setShowEmojiPicker(false);
  };

  const handlePost = () => {
    console.log("Posting:", { content, mediaFiles });
    handleReset();
  };

  const onEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleTagUser = (username: string) => {
    setContent((prev) => prev + `@${username} `);
  };

  const isDisabled = !content && mediaFiles.length === 0;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[600px] bg-secondary border-border p-0 shadow-2xl gap-0 overflow-visible">

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
        <div className="p-6 flex gap-4 min-h-[300px]">
          {/* Left: Avatar & Line */}
          <div className="flex flex-col items-center pt-1">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="w-[2px] flex-1 bg-border my-3 min-h-[40px] rounded-full opacity-50"></div>
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
                  <div key={index} className="relative group flex-shrink-0">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt="Preview"
                        className="h-48 w-auto rounded-xl object-cover border border-border"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="h-48 w-auto rounded-xl object-cover border border-border"
                        controls
                      />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 transition backdrop-blur-sm border-none cursor-pointer text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-auto relative">
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

              <EmojiButton />
            </div>
          </div>
        </div>

        {/* Add to post row */}
        <div className="flex px-6 pb-4 items-center">
          <div className="flex flex-col items-center w-10"> {/* Matches left column width */}
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-text-secondary opacity-50"></div>
            </div>
          </div>
          <div className="ml-4 text-text-muted text-sm cursor-pointer hover:text-foreground transition">
            Add to post
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-6 pt-2 flex justify-end border-t-0 sm:justify-end">
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
