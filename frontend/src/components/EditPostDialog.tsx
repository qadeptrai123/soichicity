
import React from "react";
import { Image as ImageIcon, AtSign, X, Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
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
import type { Post } from "@/types/post";
import { usePostEditor } from "@/hooks/usePostEditor";
import type { MediaFile } from "@/hooks/usePostEditor";
import { useEditPost } from "@/hooks/api/use-posts";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";


interface EditPostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: Post;
}

export default function EditPostDialog({
    open,
    onOpenChange,
    post,
}: EditPostDialogProps) {

    // Helper to convert post media to initial MediaFile[]
    const initialMedia = React.useMemo(() => {
        let initial: MediaFile[] = [];
        if (post.gallery && post.gallery.length > 0) {
            initial = post.gallery.map(url => {
                // Determine type based on url extension or logic if needed, but 'image' is safe default for gallery usually
                // Unless we have mixed gallery types metadata which we might not here.
                // For now, assume image unless it ends in mp4/webm etc? 
                // Simple extension check:
                const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                return {
                    url,
                    type: isVideo ? "video" : "image",
                };
            });
        } else if (post.media_url) {
            const isYoutube = post.media_url.includes("youtube.com") || post.media_url.includes("youtu.be");
            initial = [{
                url: post.media_url,
                type: (post.media_type === "video" || isYoutube) ? "video" : "image"
            }];
        }
        return initial;
    }, [post.gallery, post.media_url, post.media_type]);

    const {
        content,
        setContent,
        mediaFiles,
        tagSearch,
        setTagSearch,
        fileInputRef,
        filteredFriends,
        handleFileUpload,
        removeMedia,
        onEmojiClick,
        handleTagUser,
    } = usePostEditor({
        initialContent: post.content,
        initialMedia: initialMedia
    });

    const editPostMutation = useEditPost();

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleSave = () => {
        // If empty content and no media, maybe prevent? Or allow deleting text?
        // Generally prevent both empty.
        if (!content.trim() && mediaFiles.length === 0) return;

        const formData = new FormData();
        formData.append("content", content);

        // Filter media: 
        // New files have 'file' property.
        // Existing files only have 'url'.
        // We send new files as 'files' to upload.
        // We send existing file URLs as ... 'media_urls'? 
        // The backend logic is unknown. 
        // Standard approach: if we don't send 'files', backend keeps existing? 
        // Or we send a list of 'kept_media'.

        // For now, I will append 'files' for new ones.
        // And I will try to append 'existing_media' or similar if I can guess the API.
        // Given I can't check backend code, I'll just append what I can.

        mediaFiles.forEach((media) => {
            if (media.file) {
                formData.append("files", media.file);
            } else {
                // It's existing. 
                // If backend replaces gallery, we need to send these back.
                // Let's assume 'gallery' field can take URLs?
                formData.append("gallery", media.url);
            }
        });

        editPostMutation.mutate({ postId: post.post_id, data: formData }, {
            onSuccess: () => {
                handleClose();
            },
            onError: (error) => {
                console.error("Failed to update post", error);
            }
        });
    };

    // Determine if disabled
    const hasChanges = content !== post.content ||
        mediaFiles.length !== (post.gallery?.length || (post.media_url ? 1 : 0)) ||
        mediaFiles.some(m => !!m.file); // Any new file is a change

    const isDisabled = (!content.trim() && mediaFiles.length === 0) || !hasChanges;


    const currentUser = post.author || { username: "me", full_name: "Me", uid: "me", avatar_url: DEFAULT_AVATAR_URL };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-secondary border-border p-0 shadow-2xl gap-0 overflow-visible flex flex-col [&>button]:hidden -mt-9 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4">

                {/* HEADER */}
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border space-y-0">
                    <button
                        onClick={handleClose}
                        className="text-text-secondary hover:text-foreground text-sm font-medium bg-transparent border-none cursor-pointer p-0 transition-colors"
                    >
                        Cancel
                    </button>
                    <DialogTitle className="text-base font-bold text-foreground m-0">Edit Post</DialogTitle>
                    <DialogDescription className="sr-only">
                        Edit your post.
                    </DialogDescription>
                    <div className="w-[40px]"></div>
                </DialogHeader>



                {/* SCROLLABLE CONTENT */}
                <div className="p-6 flex gap-4 overflow-y-auto max-h-[60vh] min-h-[200px]">
                    <div className="flex flex-col items-center pt-1">
                        <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={currentUser.avatar_url || DEFAULT_AVATAR_URL} alt={currentUser.username} />
                            <AvatarFallback>{(currentUser.full_name || currentUser.username).charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="w-[2px] flex-1 bg-border my-3 rounded-full opacity-50"></div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-base text-foreground">
                                {currentUser.full_name || currentUser.username}
                            </span>
                            <span className="text-text-secondary text-sm">
                                @{currentUser.username}
                            </span>
                            <span className="text-text-secondary text-sm">· {formatRelativeTime(post.created_at)}</span>
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full bg-transparent border-none text-foreground placeholder-text-muted focus:ring-0 resize-none text-base outline-none p-0 min-h-[100px] leading-relaxed mb-4"
                            autoFocus
                        />

                        {/* Media Preview */}
                        {mediaFiles.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto py-2 mb-4 scrollbar-hide">
                                {mediaFiles.map((item, index) => (
                                    <div key={index} className="relative flex-shrink-0 max-w-[480px] rounded-xl overflow-hidden border border-border group">
                                        {item.type === "image" ? (
                                            <img src={item.url} alt="Preview" className="max-h-64 w-auto object-contain bg-black/10" />
                                        ) : (
                                            <video src={item.url} className="max-h-64 w-auto object-contain bg-black/10" controls />
                                        )}
                                        <button
                                            onClick={() => removeMedia(index)}
                                            className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Toolbar */}
                        <div className="flex items-center gap-2 mt-auto relative">
                            <Button onClick={() => fileInputRef.current?.click()} className="text-text-secondary hover:bg-white/10 transition bg-transparent border-none cursor-pointer p-2 rounded-full h-auto w-auto">
                                <ImageIcon size={20} />
                            </Button>
                            <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

                            <DropdownMenu onOpenChange={(isOpen) => !isOpen && setTagSearch("")}>
                                <DropdownMenuTrigger asChild>
                                    <Button className="text-text-secondary hover:bg-white/10 transition bg-transparent border-none cursor-pointer p-2 rounded-full h-auto w-auto outline-none">
                                        <AtSign size={20} />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    className="bg-secondary border-border text-foreground w-64 max-h-[280px] overflow-y-auto no-scrollbar p-0"
                                    align="start"
                                >
                                    <div className="sticky top-0 bg-secondary/95 backdrop-blur-sm p-2 z-10 border-b border-white/10">
                                        <div className="relative flex items-center">
                                            <Search className="absolute left-2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search friends..."
                                                value={tagSearch}
                                                onChange={(e) => setTagSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full bg-black/20 text-sm text-foreground rounded-md py-1.5 pl-8 pr-2 outline-none border border-transparent focus:border-white/20 placeholder:text-muted-foreground/50"
                                                autoFocus={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-1">
                                        {filteredFriends.length > 0 ? (
                                            filteredFriends.map((user) => (
                                                <DropdownMenuItem
                                                    key={user.uid}
                                                    onClick={() => handleTagUser(user.username)}
                                                    className="cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2 py-2 px-2 rounded-md"
                                                >
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarFallback className="text-[10px] bg-primary/20">{(user.full_name || user.username).charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium leading-none">{user.full_name || user.username}</span>
                                                        <span className="text-[10px] text-muted-foreground">@{user.username}</span>
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

                            <EmojiButton onSelect={onEmojiClick} />
                        </div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <DialogFooter className="p-6 pt-4 flex justify-end mt-0">
                    <Button
                        onClick={handleSave}
                        disabled={isDisabled || editPostMutation.isPending}
                        className={`rounded-full font-semibold px-6 py-2 h-auto text-sm transition-all border-none ${isDisabled
                            ? "bg-primary/50 text-white/50 cursor-not-allowed"
                            : "bg-[#3b82f6] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                            }`}
                    >
                        {editPostMutation.isPending ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
