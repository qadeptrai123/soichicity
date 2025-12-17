import { useState, useRef } from "react";

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
interface UsePostEditorProps {
  mockFriends: User[];
}

export function usePostEditor({ mockFriends }: UsePostEditorProps) {
  const [content, setContent] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [tagSearch, setTagSearch] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter friends based on search query
  const filteredFriends = mockFriends.filter((user) => {
    const query = tagSearch.toLowerCase();
    const matchName = user.name ? user.name.toLowerCase().includes(query) : false;
    const matchUsername = user.username.toLowerCase().includes(query);
    return matchName || matchUsername;
  });

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: MediaFile[] = Array.from(e.target.files).map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        file: file,
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);
    }
  };


  
  // Remove media file
  const removeMedia = (indexToRemove: number) => {
    setMediaFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Reset all states
  const handleReset = () => {
    setContent("");
    setMediaFiles([]);
    setTagSearch("");
  };

  // Add emoji to content
  const onEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  // Tag user in content
  const handleTagUser = (username: string) => {
    setContent((prev) => prev + `@${username} `);
    setTagSearch("");
  };

  return {
    content,
    setContent,
    mediaFiles,
    setMediaFiles,
    tagSearch,
    setTagSearch,
    fileInputRef,
    filteredFriends,
    handleFileUpload,
    removeMedia,
    handleReset,
    onEmojiClick,
    handleTagUser,
  };
}
