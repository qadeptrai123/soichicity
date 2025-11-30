
import React, { useState, useRef } from "react";
import { 
  Image as ImageIcon, 
  Plus, 
  AtSign, 
  Smile,
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MediaFile = { url: string; type: "image" | "video" };

// --- Danh sách emoji mẫu ---
const EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
  "🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚",
  "😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸",
  "🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️",
  "😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡",
  "🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓",
  "🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄",
  "😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵",
  "🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠",
];

export default function CreatePostCard() {
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
  };

  const handlePost = () => {
    console.log("Posting:", { content, mediaFiles });
    handleReset();
  };

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const isDisabled = !content && mediaFiles.length === 0;

  return (
    <div className="w-full flex justify-center px-100"> 
      <Card className="w-160! bg-[#1E2939] border-neutral-800 p-4 gap-4 shadow-2xl rounded-xl justify-center">
        
        {/* 1. CARD HEADER */}
        <CardHeader className="flex items-center justify-between p-4 border-b h-14 -mx-4!">
          <button 
            onClick={handleReset}
            className="text-[#99A1AF] hover:text-white text-[14px] bg-[#1E2939]! border-none cursor-pointer p-0 font-normal"
          >
            Cancel
          </button>
          <CardTitle className="text-[16px] font-bold text-white">New Post</CardTitle>
          <div className="w-6"></div> {/* placeholder */}
        </CardHeader>

        {/* 2. CARD CONTENT */}
        <CardContent className="p-4 flex gap-3 min-h-[200px]">
          
          {/* Left column: Avatar + line */}
          <div className="flex flex-col items-center pt-1">
            <Avatar className="w-9 h-9 border border-neutral-700">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="w-[2px] flex-1 bg-[#364153] my-2 min-h-[40px] rounded-full"></div>
            <Avatar className="w-6 h-6 opacity-40 border border-[#364153]">
              <div className="w-3 h-3 bg-[#364153] rounded-full m-auto"></div>
            </Avatar>
          </div>

          {/* Right column: Input + Icons + Preview */}
          <div className="flex-1 flex flex-col">
            <p className="font-semibold text-sm mb-1 text-white">yourUsername</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's new?"
              className="w-full bg-transparent border-none text-white placeholder-[#6A7282] focus:ring-0 !resize-y text-sm outline-none p-0 min-h-[100px] leading-relaxed mb-2"
            />

            {/* Media preview */}
            {mediaFiles.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide mb-2">
                {mediaFiles.map((item, index) => (
                  <div key={index} className="relative group flex-shrink-0">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt="Preview"
                        className="h-48 w-auto rounded-xl object-cover border border-neutral-800"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="h-48 w-auto rounded-xl object-cover border border-neutral-800"
                        controls
                      />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 transition backdrop-blur-sm flex items-center justify-center border-none cursor-pointer"
                    >
                      <Plus className="rotate-45 w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Icons */}
            <div className="flex items-center gap-0 text-neutral-500 mt-1 relative">
              <button onClick={() => fileInputRef.current?.click()} className="hover:text-neutral-300 transition bg-[#1E2939]! border-none cursor-pointer p-0">
                <ImageIcon size={18} />
              </button>
              <button className="hover:text-[#99A1AF] transition bg-[#1E2939]! border-none cursor-pointer p-0">
                <AtSign size={18} />
              </button>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                className="hover:text-[#99A1AF] transition bg-[#1E2939]! border-none cursor-pointer p-0 relative"
              >
                <Smile size={18} />
              </button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-72 max-h-72 bg-white border border-neutral-300 rounded-lg p-2 grid grid-cols-6 gap-2 shadow-lg z-50 overflow-y-auto">
                  {EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEmojiClick(emoji)}
                      className="flex items-center justify-center w-10 h-10 text-xl hover:bg-neutral-700 rounded transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 text-[#6A7282] text-sm cursor-text pl-1">Add to post</div>

            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </div>
        </CardContent>

        {/* 3. CARD FOOTER */}
        <CardFooter className="pt-4! pb-2! px-4! flex justify-end border-t -mx-4!">
          <Button 
            onClick={handlePost}
            disabled={isDisabled}
            className={`rounded-3xl! font-bold px-7! py-2! h-auto text-[14px] transition-all border-none ${
              isDisabled 
                ? "bg-[#2B7FFF]! text-[#FFFFFF] cursor-not-allowed" 
                : "bg-[#2B7FFF]! text-[#FFFFFF] hover:bg-[#2B7FFF]!"
            }`}
          >
            Post
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
