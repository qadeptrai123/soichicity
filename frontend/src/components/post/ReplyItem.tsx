import { ActionButton } from "@/components/ActionButton";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLikePost, useSavePost, usePostReplies, useRepostPost } from "@/hooks/api/use-posts";
import { Heart, MessageSquare, Bookmark, X, Repeat2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Gallery, getYouTubeEmbedUrl, isYouTubeUrl } from "../Gallery";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthProvider";
import { useBlockUser } from "@/hooks/api/use-users";
import { BlockUserDialog } from "@/components/BlockUserDialog";
import { DropdownExtend } from "../DropdownExtend";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Trash2, Edit3 } from "lucide-react";
import { DeletePostDialog } from "@/components/DeletePostDialog";
import { useDeletePost } from "@/hooks/api/use-posts";
import TextWithMentions from "../TextWithMentions";
// import type { MediaItem } from "@/types/common";


interface ReplyItemProps {
    reply: any;
    onReplyClick: (reply: any) => void;
    isNested?: boolean;
    onEdit?: (post: any) => void;
    onAuthRequired?: () => void;
}

const COLORS = {
    bgPage: "bg-[#0A0E1A]",
    bgCard: "bg-[#1A1F2E]",
    bgInput: "bg-[#0D1520]",
    border: "border-[#374151]",
    textSec: "text-[#94a3b8]",
    primary: "text-[#2B7FFF]"
};

export const ReplyItem = ({ reply, onReplyClick, isNested = false, onEdit, onAuthRequired }: ReplyItemProps) => {
    // console.log(reply)
    const navigate = useNavigate();
    // Hooks
    const likeMutation = useLikePost();
    const saveMutation = useSavePost();
    const repostMutation = useRepostPost();

    // Optimistic UI State
    const [likesCount, setLikesCount] = useState(reply.likes_count || 0);
    const [isLiked, setIsLiked] = useState(reply.is_liked || false);
    const [repostsCount, setRepostsCount] = useState(reply.reposts_count || 0);
    const [isReposted, setIsReposted] = useState(reply.is_reposted || false);
    const [savesCount, setSavesCount] = useState(reply.saves_count || 0);
    const [isSaved, setIsSaved] = useState(reply.is_saved || false);
    const [showBlockDialog, setShowBlockDialog] = useState(false);

    // Delete State
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const deleteMutation = useDeletePost();

    const handleDelete = () => {
        deleteMutation.mutate(reply.post_id, {
            onSuccess: () => {
                setShowDeleteDialog(false);
            }
        });
    };

    const { user: me, isAuthenticated } = useAuth();
    const blockMutation = useBlockUser();

    // Media State
    const [showSingleMediaLightbox, setShowSingleMediaLightbox] = useState(false);
    const [, setIsGalleryDragging] = useState(false);

    // Nested Replies State
    const [showReplies, setShowReplies] = useState(false);
    const [visibleRepliesCount, setVisibleRepliesCount] = useState(3);

    // Fetch replies using hook, enabled only when showReplies is true
    const { data: repliesData, isLoading: isLoadingReplies } = usePostReplies(reply.post_id, showReplies);
    const replies = repliesData || [];

    const handleLoadReplies = () => {
        setShowReplies(true);
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (reply.author?.username) {
            navigate(`/profile/${reply.author.username}`);
        }
    };

    const handleLike = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        setIsLiked(!isLiked);
        setLikesCount((prev: number) => prev + (isLiked ? -1 : 1));
        likeMutation.mutate(reply.post_id);
    };

    const handleSave = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        setIsSaved(!isSaved);
        setSavesCount((prev: number) => prev + (isSaved ? -1 : 1));
        saveMutation.mutate({ postId: reply.post_id, wasSaved: isSaved });
    };

    const handleRepost = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        setIsReposted(!isReposted);
        setRepostsCount((prev: number) => prev + (isReposted ? -1 : 1));
        repostMutation.mutate({ postId: reply.post_id, wasReposted: isReposted });
    };



    // --- Preprocess Gallery Data ---
    const processedData = useMemo(() => {
        let gallery: string[] | undefined;

        if (reply.gallery && reply.gallery.length > 0) {
            // Backend might send [{url: "..."}] (legacy) or ["..."]
            if (typeof reply.gallery[0] === 'string') {
                gallery = reply.gallery;
            } else if (typeof reply.gallery[0] === 'object' && reply.gallery[0].url) {
                gallery = reply.gallery.map((item: any) => item.url);
            }
        } else if (reply.media_urls && reply.media_urls.length > 0) {
            gallery = reply.media_urls;
        }

        const finalGallery = gallery && gallery.length > 1 ? gallery : undefined;
        const finalMediaUrl = gallery && gallery.length === 1 ? gallery[0] : (reply.media_url || null);

        let finalMediaType = reply.media_type || null;
        if (gallery && gallery.length === 1) {
            const url = gallery[0];
            const isYoutube = /(?:youtube\.com|youtu\.be)/.test(url);
            const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
            finalMediaType = isYoutube ? "youtube" : isVideo ? "video" : "image";
        }

        return {
            gallery: finalGallery,
            media_url: finalMediaUrl,
            media_type: finalMediaType
        };
    }, [reply]);

    const handleBlockConfirm = () => {
        if (reply.author?.uid) {
            blockMutation.mutate(reply.author.uid, {
                onSuccess: () => {
                    setShowBlockDialog(false);
                },
            });
        }
    };

    const replyActions = [

        // Edit/Delete for Owner
        ...(String(me?.uid) === String(reply.author?.uid) ? [
            {
                id: "edit",
                label: "Edit",
                icon: <Edit3 size={16} />,
                onClick: () => onEdit?.(reply),
                isVisible: !!onEdit,
            },
            {
                id: "delete",
                label: "Delete",
                icon: <Trash2 size={16} />,
                onClick: () => setShowDeleteDialog(true),
                isVisible: true,
                variant: "destructive" as const,
                showSeparatorAfter: true,
            }
        ] : []),
        {
            id: "block",
            label: "Block",
            icon: <Ban size={16} />,
            onClick: () => setShowBlockDialog(true),
            isVisible: isAuthenticated && String(me?.uid) !== String(reply.author?.uid),
            variant: "destructive" as const,
        }
    ];

    const hasGallery = processedData.gallery && processedData.gallery.length > 0;
    const hasSingleMedia = processedData.media_url && !hasGallery;
    const isYoutube = hasSingleMedia ? isYouTubeUrl(processedData.media_url!) : false;
    const embedUrl = isYoutube ? getYouTubeEmbedUrl(processedData.media_url!) : null;
    const actualMediaType = hasSingleMedia
        ? isYoutube
            ? "youtube"
            : processedData.media_type
        : null;

    return (
        <div
            id={`comment-${reply.post_id}`}
            className={`flex gap-4 group pt-3 pb-3 ${isNested ? 'px-0' : 'px-6'} transition-colors duration-500`}
        >
            <div className="flex flex-col items-center shrink-0">
                <Avatar
                    className={`w-10 h-10 border ${COLORS.border} z-10 cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={handleProfileClick}
                >
                    <AvatarImage src={reply.author.avatar_url || reply.author.avatar || DEFAULT_AVATAR_URL} />
                    <AvatarFallback>{reply.author.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="w-0.5 grow bg-[#374151] rounded-full"></div>
            </div>

            <div className="flex-1 pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="font-bold text-[15px] text-white cursor-pointer hover:underline"
                            onClick={handleProfileClick}
                        >
                            {reply.author.full_name}
                        </span>
                        <span
                            className="text-[#64748b] text-sm cursor-pointer hover:underline"
                            onClick={handleProfileClick}
                        >
                            @{reply.author.username}
                        </span>
                        <span className="text-[#64748b] text-xs">• {formatRelativeTime(reply.created_at)}</span>
                    </div>
                    <DropdownExtend actions={replyActions} triggerType="icon" />
                </div>
                <div className="text-[#e2e8f0] text-[15px] leading-relaxed mb-3 font-normal whitespace-pre-wrap">
                    <TextWithMentions content={reply.content} />
                </div>
                {hasGallery ? (
                    <div className="mb-3">
                        <Gallery
                            items={processedData.gallery!}
                            onDragStateChange={setIsGalleryDragging}
                            size="small"
                        />
                    </div>
                ) : (
                    hasSingleMedia && (
                        <>
                            <div
                                className="rounded-lg overflow-hidden mt-1 mb-3 w-fit cursor-pointer border border-[#374151]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSingleMediaLightbox(true);
                                }}
                            >
                                {isYoutube ? (
                                    <div className="relative w-full bg-black min-w-[300px]" style={{ paddingBottom: "56.25%" }}>
                                        <iframe
                                            src={embedUrl!}
                                            title="YouTube video"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                        />
                                    </div>
                                ) : actualMediaType === "video" ? (
                                    <video
                                        controls
                                        className="media-content max-h-[250px] w-full object-cover"
                                        src={processedData.media_url!}
                                    />
                                ) : (
                                    <img
                                        src={processedData.media_url!}
                                        alt="Reply media"
                                        className="media-content max-h-[250px] w-full h-auto object-contain object-left"
                                    />
                                )}
                            </div>

                            {showSingleMediaLightbox && (
                                <div
                                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSingleMediaLightbox(false);
                                        }}
                                        className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
                                    >
                                        <X size={24} />
                                    </button>

                                    {isYoutube ? (
                                        <div className="relative w-full max-w-4xl bg-black" style={{ paddingBottom: "56.25%" }}>
                                            <iframe
                                                src={embedUrl!}
                                                title="YouTube video"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="absolute top-0 left-0 w-full h-full"
                                            />
                                        </div>
                                    ) : actualMediaType === "video" ? (
                                        <video
                                            controls
                                            autoPlay
                                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                                            src={processedData.media_url!}
                                        />
                                    ) : (
                                        <img
                                            src={processedData.media_url!}
                                            alt="Reply media lightbox"
                                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    )
                )}
                <div className="flex items-center gap-6 text-[#64748b] -ml-2">
                    <ActionButton
                        actionId="like"
                        icon={<Heart size={18} />}
                        count={likesCount}
                        onClick={handleLike}
                        isActive={isLiked}
                    />
                    <ActionButton
                        actionId="reply"
                        icon={<MessageSquare size={18} />}
                        count={reply.comments_count}
                        onClick={(e) => { e?.stopPropagation(); onReplyClick(reply); }}
                    />
                    <ActionButton
                        actionId="bookmark"
                        icon={<Bookmark size={18} />}
                        count={savesCount}
                        onClick={handleSave}
                        isActive={isSaved}
                    />
                    <ActionButton
                        actionId="repost"
                        icon={<Repeat2 size={18} />}
                        count={repostsCount}
                        onClick={handleRepost}
                        isActive={isReposted}
                    />


                </div>

                {/* --- Nested Replies Section --- */}
                {reply.comments_count > 0 && (
                    <div className="mt-2">
                        {!showReplies ? (
                            <div
                                className="flex items-center gap-2 cursor-pointer group/line"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLoadReplies();
                                }}
                            >
                                <div className="w-8 h-[1px] bg-[#374151] group-hover/line:bg-blue-500 transition-colors"></div>
                                <span className="text-[#2B7FFF] text-sm hover:underline font-medium">
                                    View {reply.comments_count} more replies
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-0">
                                {isLoadingReplies ? (
                                    <div className="text-sm text-gray-500 animate-pulse">Loading replies...</div>
                                ) : (
                                    <>
                                        {replies.slice(0, visibleRepliesCount).map((subReply: any) => (
                                            <ReplyItem
                                                key={subReply.post_id}
                                                reply={subReply}
                                                onReplyClick={onReplyClick}
                                                isNested={true}
                                                onEdit={onEdit}
                                                onAuthRequired={onAuthRequired}
                                            />
                                        ))}

                                        <div className="flex gap-4 items-center mt-2 pl-6">
                                            {visibleRepliesCount < replies.length && (
                                                <div
                                                    className="flex items-center gap-2 cursor-pointer group/line"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setVisibleRepliesCount((prev) => prev + 3);
                                                    }}
                                                >
                                                    <div className="w-4 h-[1px] bg-[#374151] group-hover/line:bg-blue-500 transition-colors"></div>
                                                    <span className="text-[#2B7FFF] text-sm hover:underline font-medium">
                                                        View more replies ({replies.length - visibleRepliesCount} remaining)
                                                    </span>
                                                </div>
                                            )}

                                            <div
                                                className="flex items-center gap-2 cursor-pointer group/line"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowReplies(false);
                                                    setVisibleRepliesCount(3);
                                                }}
                                            >
                                                <div className="w-4 h-[1px] bg-[#374151] group-hover/line:bg-red-500 transition-colors"></div>
                                                <span className="text-[#94a3b8] text-sm hover:underline hover:text-red-400 font-medium">
                                                    Hide replies
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <BlockUserDialog
                isOpen={showBlockDialog}
                onClose={() => setShowBlockDialog(false)}
                onConfirm={handleBlockConfirm}
                username={reply.author?.username || ""}
                avatarUrl={reply.author?.avatar_url}
                isPending={blockMutation.isPending}
            />
            <DeletePostDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                isDeleting={deleteMutation.isPending}
            />
        </div>
    );
};
