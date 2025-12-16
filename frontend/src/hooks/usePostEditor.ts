
import { useState, useRef } from "react";
import type { User } from "@/types/auth";

export type MediaFile = { url: string; type: "image" | "video"; file?: File; };

interface UsePostEditorProps {
    mockFriends: User[];
}

export function usePostEditor({ mockFriends }: UsePostEditorProps) {
    const [content, setContent] = useState<string>("");
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [tagSearch, setTagSearch] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredFriends = mockFriends.filter((user) => {
        const query = tagSearch.toLowerCase();
        const matchName = user.full_name ? user.full_name.toLowerCase().includes(query) : false;
        const matchUsername = user.username.toLowerCase().includes(query);
        return matchName || matchUsername;
    });

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

    const removeMedia = (indexToRemove: number) => {
        setMediaFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const resetEditor = () => {
        setContent("");
        setMediaFiles([]);
        setTagSearch("");
    };

    const onEmojiClick = (emoji: string) => {
        setContent((prev) => prev + emoji);
    };

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
        resetEditor,
        onEmojiClick,
        handleTagUser,
    };
}
