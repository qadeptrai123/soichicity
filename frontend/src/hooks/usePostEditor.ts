
import { useState, useRef, useEffect } from "react";
import type { User } from "@/types/auth";
import { useAuth } from "@/contexts/AuthProvider";
import { useFollowingAndFollowers } from "./api/use-users";

export type MediaFile = { url: string; type: "image" | "video"; file?: File; };

interface UsePostEditorProps {
    mockFriends?: User[]; // Make it optional since we'll fetch real data
    initialContent?: string;
    initialMedia?: MediaFile[];
    enabled?: boolean;
}

export function usePostEditor({ mockFriends = [], initialContent = "", initialMedia = [], enabled = true }: UsePostEditorProps) {
    const [content, setContent] = useState<string>(initialContent);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(initialMedia);
    const [tagSearch, setTagSearch] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current user to fetch their following/followers
    const { user } = useAuth();
    const { allUsers, isLoading } = useFollowingAndFollowers(user?.uid || '', { enabled: enabled && !!user?.uid });

    // Sync initialContent when it changes
    useEffect(() => {
        if (initialContent) {
            setContent(initialContent);
        }
        if (initialMedia.length > 0) {
            setMediaFiles(initialMedia);
        }
    }, [initialContent, initialMedia]);

    // Use real data if available, otherwise fall back to mockFriends
    const availableUsers = allUsers.length > 0 ? allUsers : mockFriends;

    const filteredFriends = availableUsers.filter((user) => {
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
        isLoadingUsers: isLoading,
    };
}
