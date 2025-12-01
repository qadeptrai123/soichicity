
"use client";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Smile } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

export default function EmojiButton({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    // Thêm modal={true} giúp Popover chiếm quyền ưu tiên, xử lý focus tốt hơn
    <Popover modal={true}>
      <PopoverTrigger asChild className="p-0">
        <Button className="text-text-secondary hover:text-foreground transition bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-white/5">
          <Smile size={10} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={10}
        className="w-fit p-0 border-none z-[1000] shadow-2xl rounded-lg bg-transparent"
        style={{ width: "300px", maxHeight: "300px" }}
        
        // --- QUAN TRỌNG: Ngăn chặn sự kiện cuộn lan ra ngoài Dialog ---
        onWheel={(e) => e.stopPropagation()}      // Cho chuột
        onTouchMove={(e) => e.stopPropagation()}  // Cho màn hình cảm ứng
      >
        <div className="
            [&_.epr-body::-webkit-scrollbar]:hidden 
            [&_.epr-body]:[scrollbar-width:none] 
            [&_.epr-body]:[-ms-overflow-style:none] 
            [&_.epr-body]:!overflow-y-auto 
            [&_.epr-body]:cursor-grab
        ">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
            height={300}
            width={300}
            lazyLoadEmojis={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}