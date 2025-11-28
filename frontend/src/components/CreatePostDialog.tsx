import React, { useState, useRef } from "react";
import { 
  Image as ImageIcon, 
  Plus, 
  Globe, 
  Users, 
  Hash, 
  AtSign, 
  Music,
  Smile,
  File,
  Link as LinkIcon,
  MapPin,
  Play
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CreatePostDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [replyPrivacy, setReplyPrivacy] = useState<"default" | "everyone" | "followers">("default");

  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC XỬ LÝ ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newImageUrls = newFiles.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newImageUrls]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handlePost = () => {
    console.log("Posting:", { content, images, replyPrivacy });
    setContent("");
    setImages([]);
    setIsOpen(false);
  };

  const isDisabled = !content && images.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      
      {/* TRIGGER: Nút Dấu cộng (+) ở góc phải dưới */}
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          size="icon" 
          className="fixed bottom-10 right-10 h-14 w-14 rounded-full shadow-lg bg-white text-black hover:bg-gray-200 transition-all border border-gray-300 z-50"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </DialogTrigger>

      {/* POPUP CHÍNH */}
      <DialogContent className="sm:max-w-[600px] !bg-gray-900 text-white border-neutral-800 p-0 gap-0 shadow-2xl [&>button]:hidden rounded-xl">
        
        {/* --- HEADER: Cancel - Title - Empty --- */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-neutral-800 space-y-0 h-14">
          
          {/* Nút Cancel bên trái */}
          <div className="flex-1 flex justify-start">
            <button 
              onClick={() => setIsOpen(false)}
              className="!text-neutral-300 hover:text-white !text-[12px] font-normal outline-none transition-colors !bg-slate-900 border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Tiêu đề New thread ở giữa */}
          <div className="flex-[2] flex justify-center pr-7"> {/* pr-6 để đẩy chữ sang trái một chút */}
            <DialogTitle className="text-[16px] font-bold text-white">
              New thread
            </DialogTitle>
          </div>

          {/* 3. Khoảng trống bên phải (Giữ nguyên để cân đối) */}
          <div className="flex-1"></div>
        </DialogHeader>

        {/* --- BODY --- */}
        <div className="p-4 flex gap-3 min-h-[150px]">
          
          {/* Cột trái: Avatar + Sợi chỉ */}
          <div className="flex flex-col items-center pt-1">
            <Avatar className="w-9 h-9 border border-neutral-700">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            
            {/* Sợi chỉ nối dài xuống dưới */}
            <div className="w-[2px] flex-1 bg-neutral-800 my-2 min-h-[60px] rounded-full"></div>
            
            {/* Avatar mờ cho phần "Add to thread" */}
            <Avatar className="w-5 h-5 opacity-40">
               <AvatarFallback className="text-[8px] bg-neutral-800 text-white">Me</AvatarFallback>
            </Avatar>
          </div>

          {/* Cột phải: Input + Icons */}
          <div className="flex-1 flex flex-col">
            
            {/* Tên User */}
            <div>
              <p className="font-semibold text-sm mb-1">yourUsername</p>
              
              {/* Ô nhập liệu */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's new?"
                className="w-full bg-transparent border-none text-white placeholder-neutral-500 focus:ring-0 !resize-y text-sm outline-none !p-2 min-h-[120px]" 
              />
            </div>

            {/* Preview Ảnh */}
            {images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
                {images.map((img, index) => (
                  <div key={index} className="relative group flex-shrink-0">
                    <img
                      src={img}
                      alt="Preview"
                      className="h-48 w-auto rounded-xl object-cover border border-neutral-800"
                    />
                    {/* Nút xóa ảnh (Dấu cộng xoay 45 độ) */}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 transition backdrop-blur-sm flex items-center justify-center border-none cursor-pointer"
                    >
                      <Plus className="rotate-45 w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hàng Icons chức năng */}
            <div className="flex items-center gap-2 !text-neutral-500 mt-3">
              <button onClick={() => fileInputRef.current?.click()} className="hover:text-neutral-300 transition outline-none !bg-slate-900 border-none cursor-pointer !p-1">
                <ImageIcon size={15} />
              </button>
              
              <button className="hover:text-neutral-300 transition outline-none !bg-gray-900 border-none cursor-pointer !p-1"><Play size={15} /></button>
              <button className="hover:text-neutral-300 transition outline-none !bg-gray-900 border-none cursor-pointer !p-1"><Music size={15} /></button>
              <button className="hover:text-neutral-300 transition outline-none !bg-gray-900 border-none cursor-pointer !p-1"><File size={15} /></button>
              <button className="hover:text-neutral-300 transition outline-none !bg-gray-900 border-none cursor-pointer !p-1"><LinkIcon size={15} /></button>
              <button className="hover:text-neutral-300 transition outline-none !bg-gray-900 border-none cursor-pointer !p-1"><MapPin size={15} /></button>
              <button className="hover:text-neutral-300 transition outline-none !bg-gray-900 border-none cursor-pointer !p-1"><Hash size={15} /></button>
              <button className="hover:text-neutral-300 transition outline-none !bg-gray-900 border-none cursor-pointer !p-1"><AtSign size={15} /></button>
              <button className="hover:text-neutral-300 transition outline-none !bg-gray-900 border-none cursor-pointer !p-1"><Smile size={15} /></button>
           
            </div>

            {/* Phần "Add to thread" mờ bên dưới */}
            <div className="mt-6 text-neutral-600 text-sm cursor-text pl-1">
                Add to thread
            </div>

            {/* Input file ẩn */}
            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 flex flex-col items-start gap-3 mt-auto">
        {/* Đường kẻ phía trên */}
         <div className="w-full h-px !bg-gray-800 mb-2"></div>
 
        {/* Nút Reply options */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <button className="!text-neutral-300 !text-[10px] cursor-pointer hover:text-neutral-300 outline-none transition-colors flex items-center gap-2 !bg-slate-900 border-none p-0">
                <span className="!text-white/40 font-bold text-[13px] leading-none pb-1">...</span> 
                <span className="!text-white/40 text-[13px]">
                {replyPrivacy === "default"
                    ? "Reply options"
                    : replyPrivacy === "everyone"
                    ? "Anyone"
                    : "Followers only"}
                </span>
            </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="bg-[#1e1e1e] border-neutral-800 text-white min-w-[200px]">
            <DropdownMenuItem onClick={() => setReplyPrivacy("everyone")} className="gap-2 py-3 hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white cursor-pointer">
                <Globe size={16} className="text-neutral-400" /> <span className="font-medium">Anyone</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setReplyPrivacy("followers")} className="gap-2 py-3 hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white cursor-pointer">
                <Users size={16} className="text-neutral-400" /> <span className="font-medium">Followers</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {/* Đường kẻ phía dưới */}
        <div className="w-full h-px !bg-gray-800 mt-2"></div>
        </div>
        {/* Nút Post nằm dưới nút Reply options */}
        {/* Nút Post nằm bên phải */}
        <div className="flex-[2] flex justify-end !pr-7 w-full pb-6">
            <Button 
                onClick={handlePost}
                disabled={isDisabled}
                className={`!rounded-2xl font-bold !px-7 !py-1 h-auto text-[15px] transition-colors border-none ${
                isDisabled 
                  ? "!bg-blue-600/80 !text-white cursor-not-allowed opacity-50" 
                 : "!bg-blue-800 !text-white hover:!bg-blue-900"
                }`}
            >
                Post
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

