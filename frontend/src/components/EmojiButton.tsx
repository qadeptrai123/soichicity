
"use client";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Smile } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

export default function EmojiButton({ onSelect }: { onSelect: (emoji: string) => void }) {
  const searchBackgroundColor = "#1A1F2E";
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
        
        onWheel={(e) => e.stopPropagation()}     
        onTouchMove={(e) => e.stopPropagation()}  
      >
        <style>{`
          .EmojiPickerReact .epr-category-nav {
            display: none !important;
          }
            
          aside.EmojiPickerReact.epr-main {
            border-width: 2px !important; 
            border-style: solid !important;
          }
        `}</style>
        
        <div className="
            [&_.epr-body::-webkit-scrollbar]:hidden 
            [&_.epr-body]:[scrollbar-width:none] 
            [&_.epr-body]:[-ms-overflow-style:none] 
            [&_.epr-body]:!overflow-y-auto 
            [&_.epr-body]:cursor-grab
            [&_input]:!bg-[#1A1F2E]
            [&_input:focus]:!bg-[#1A1F2E] 
            [&_input]:!outline-none
            "
        >

          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
            height={300}
            width={300}
            lazyLoadEmojis={true}
            previewConfig={{ showPreview: false }}
            style={{
                "--epr-bg-color": "#1A1F2E",              // Màu nền chính
                "--epr-category-label-bg-color": "#1A1F2E", // Màu nền thanh tiêu đề dính
                "--epr-text-color": "#ffffff",            // Màu chữ
                "--epr-picker-border-color": "#1E2939",   // Màu viền
                
                "--epr-search-input-bg-color": searchBackgroundColor,
                "--epr-search-input-text-color": "#ffffff", // Màu chữ ô tìm kiếm
                "--epr-preview-text-color": "#ffffff",    // Màu chữ ở thanh preview dưới đáy
                "--epr-focus-bg-color": "transparent",
            } as React.CSSProperties}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

