import React from "react";
import { Image as ImageIcon, AtSign, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmojiButton from "./EmojiButton";

type MediaFile = { 
  url: string; 
  type: "image" | "video"; 
  file: File;
};

type User = {
  id: string | number;
  username: string;
  name: string | null;
  avatarUrl?: string;
};

interface PostEditorActionsProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  tagSearch: string;
  setTagSearch: (value: string) => void;
  filteredFriends: User[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTagUser: (username: string) => void;
  onEmojiClick: (emoji: string) => void;
  variant?: "default" | "inline";
}

interface MediaPreviewProps {
  mediaFiles: MediaFile[];
  onRemove: (index: number) => void;
  variant?: "default" | "compact";
}

// Component for Media Preview
export function MediaPreview({ mediaFiles, onRemove, variant = "default" }: MediaPreviewProps) {
  if (mediaFiles.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className="flex gap-2 overflow-x-auto py-2 mt-2 no-scrollbar">
        {mediaFiles.map((item, index) => (
          <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden border border-border flex-shrink-0 group">
            <img src={item.url} className="w-full h-full object-cover" alt="preview" />
            <button 
              onClick={() => onRemove(index)} 
              className="absolute top-0 right-0 bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition"
            >
              <X size={12}/>
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto py-2 mb-4 scrollbar-hide">
      {mediaFiles.map((item, index) => (
        <div key={index} className="relative flex-shrink-0 max-w-[480px] rounded-xl overflow-hidden border border-border">
          {item.type === "image" ? (
            <img src={item.url} alt="Preview" className="max-h-64 w-auto object-contain bg-black/10" />
          ) : (
            <video src={item.url} className="max-h-64 w-auto object-contain bg-black/10" controls />
          )}
          <button
            onClick={() => onRemove(index)}
            className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-full p-1 transition border border-white/20"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Component for Action Buttons (Upload, Tag, Emoji)
export function PostEditorActions({
  fileInputRef,
  tagSearch,
  setTagSearch,
  filteredFriends,
  onFileUpload,
  onTagUser,
  onEmojiClick,
  variant = "default",
}: PostEditorActionsProps) {
  const buttonClass = variant === "inline" 
    ? "text-text-secondary hover:text-foreground transition bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-white/5"
    : "p-2 hover:text-foreground hover:bg-white/5 rounded-full transition outline-none";

  const containerClass = variant === "inline"
    ? "flex items-center gap-2 mt-auto relative"
    : "flex items-center gap-1 text-text-secondary";

  return (
    <div className={containerClass}>
      {/* File Upload */}
      {variant === "inline" ? (
        <>
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className={buttonClass}
          >
            <ImageIcon size={20} />
          </Button>
          <input 
            type="file" 
            multiple 
            accept="image/*,video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={onFileUpload} 
          />
        </>
      ) : (
        <>
          <input 
            type="file" 
            multiple 
            accept="image/*,video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={onFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className={buttonClass}
          >
            <ImageIcon size={20} />
          </button>
        </>
      )}

      {/* Tag User Dropdown */}
      <DropdownMenu onOpenChange={(isOpen) => !isOpen && setTagSearch("")}>
        <DropdownMenuTrigger asChild>
          {variant === "inline" ? (
            <Button className={buttonClass + " outline-none"}>
              <AtSign size={20} />
            </Button>
          ) : (
            <button className={buttonClass}>
              <AtSign size={20} />
            </button>
          )}
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
            {filteredFriends.length > 0 ? (
              filteredFriends.map((user) => (
                <DropdownMenuItem 
                  key={user.id} 
                  onClick={() => onTagUser(user.username)} 
                  className="hover:bg-white/10 cursor-pointer text-foreground focus:bg-white/10 focus:text-foreground flex items-center gap-2 py-2"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-[10px] bg-primary/20">
                      {(user.name || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name || user.username}</span>
                    <span className="text-[10px] text-text-secondary">@{user.username}</span>
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

      {/* Emoji Picker */}
      <div className="relative">
        <EmojiButton onSelect={onEmojiClick} /> 
      </div>
    </div>
  );
}
