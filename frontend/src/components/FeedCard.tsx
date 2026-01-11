//Kiệt
import React, { useState, useCallback, useEffect } from "react";
import TextWithMentions from "./TextWithMentions";
import { ActionButton } from "./ActionButton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  MessageSquare,
  Bookmark,
  Repeat2,
  Heart,
  Send,
  Edit3,
  Link2,
} from "lucide-react";
import { DropdownExtend } from "./DropdownExtend";
import { useNavigate } from "react-router-dom";
import { DeletePostDialog } from "./DeletePostDialog";
import { useDeletePost } from "@/hooks/api/use-posts";
import { Trash2 } from "lucide-react";

import { useLikePost, useSavePost, useRepostPost } from "@/hooks/api/use-posts";
import { useAuth } from "@/contexts/AuthProvider";
import { BlockUserDialog } from "@/components/BlockUserDialog";
import { useBlockUser } from "@/hooks/api/use-users";
import { Ban } from "lucide-react";

import type { Post as PostData, Author as AuthorData } from "@/types/post";

import { toast } from "sonner";
import { LoginPrompt } from "@/components/LoginPrompt";
// --- IMPORTED GALLERY COMPONENT ---
// Gallery logic moved to ./Gallery.tsx
import { Gallery, getYouTubeEmbedUrl, isYouTubeUrl } from "./Gallery";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";

// --- MAIN FEED CARD COMPONENT ---
import { MediaLightbox } from "./MediaLightbox";

interface FeedCardProps {
  post: PostData;
  author: AuthorData;
  onReply?: (post: PostData, author: AuthorData) => void;
  onEdit?: (post: PostData) => void;
  className?: string;
  compact?: boolean;
  hideBorder?: boolean;
  onAuthRequired?: () => void;
}


const FeedCard: React.FC<FeedCardProps> = ({
  post,
  author,
  onReply,
  onEdit,
  className,
  compact,
  hideBorder,
  onAuthRequired,
}) => {
  // Add mock author data fallback
  // const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const mockAuthor: AuthorData = {
    uid: "mock-user",
    username: "user",
    name: "Unknown User",
    handle: "@user",
    avatar_url: DEFAULT_AVATAR_URL,
    /** @deprecated */
    avatar: DEFAULT_AVATAR_URL,
  };

  const displayAuthor = author || mockAuthor;
  const { isAuthenticated, user: me } = useAuth();
  const navigate = useNavigate();
  const [showSingleMediaLightbox, setShowSingleMediaLightbox] = useState(false);
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();

  const repostMutation = useRepostPost();
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);

  // Optimistic UI State - khởi tạo từ props
  const [, setLocalCounts] = useState({
    likes: post.likes_count || 0,
    replies: post.comments_count || 0,
    bookmarks: post.saves_count || 0,
    reposts: post.reposts_count || 0,
  });

  const [, setActionStates] = useState({
    liked: post.is_liked || false,
    bookmarked: post.is_saved || false,
    reposted: post.is_reposted || false,
  });

  // Sync state với props khi data từ API thay đổi (sau khi invalidateQueries)
  useEffect(() => {
    // Nếu không đăng nhập thì reset hết về false
    if (!isAuthenticated) {
      setActionStates({
        liked: false,
        bookmarked: false,
        reposted: false,
      });
      // Không reset counts vì guest vẫn nhìn thấy số lượng
    } else {
      // Nếu đã đăng nhập thì sync theo props (mới nhất từ server)
      setActionStates({
        liked: post.is_liked || false,
        bookmarked: post.is_saved || false,
        reposted: post.is_reposted || false,
      });
    }

    // Luôn sync số lượng
    setLocalCounts({
      likes: post.likes_count || 0,
      replies: post.comments_count || 0,
      bookmarks: post.saves_count || 0,
      reposts: post.reposts_count || 0,
    });
  }, [
    post.likes_count,
    post.comments_count,
    post.saves_count,
    post.reposts_count,
    post.is_liked,
    post.is_saved,
    post.is_reposted,
    isAuthenticated, // Thêm dependency này
  ]);

  // --- Xử lý click chuyển trang ---
  const handleCardClick = () => {
    if (isGalleryDragging) return;

    // Nếu người dùng đang bôi đen text thì không chuyển trang
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    navigate(`/post/${post.post_id}`);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayAuthor?.username) {
      navigate(`/profile/${displayAuthor.username}`);
    }
  };

  // --- Xử lý click vào vùng content text ---
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isGalleryDragging) return;

    // Không navigate khi đang drag

    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    navigate(`/post/${post.post_id}`);
  };

  // --- Các handlers có chặn sự kiện (stopPropagation) ---

  const handleLike = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!isAuthenticated) {
        onAuthRequired?.();
        return;
      }
      likeMutation.mutate(post.post_id);
    },
    [post.post_id, likeMutation, isAuthenticated]
  );



  // const handleExternalShare = () => {
  //   const postUrl = `${window.location.origin}/post/${post.post_id}`;

  //   navigator.clipboard.writeText(postUrl)
  //     .then(() => {
  //       toast.success("Post link copied to clipboard");
  //     })
  //     .catch(() => {
  //       toast.error("Failed to copy link");
  //     });
  // };
  const handleExternalShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post.post_id}`;

    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // const handleBookmark = useCallback(
  //   (e?: React.MouseEvent) => {
  //     e?.stopPropagation();
  //     if (!isAuthenticated) {
  //       setShowLoginPrompt(true);
  //       return;
  //     }
  //     setActionStates((prev) => ({ ...prev, bookmarked: !prev.bookmarked }));
  //     setLocalCounts((prev) => ({
  //       ...prev,
  //       bookmarks: prev.bookmarks + (actionStates.bookmarked ? -1 : 1),
  //     }));
  //     saveMutation.mutate(post.post_id);
  //   },
  //   [actionStates.bookmarked, post.post_id, saveMutation, isAuthenticated]
  // );
  const handleBookmark = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!isAuthenticated) {
        onAuthRequired?.();
        return;
      }

      const wasSaved = post.is_saved || false;

      saveMutation.mutate({
        postId: post.post_id,
        wasSaved,
      });
    },
    [post.is_saved, post.post_id, saveMutation, isAuthenticated]
  );

  // const handleShare = useCallback(
  //   (e?: React.MouseEvent) => {
  //     e?.stopPropagation();
  //     setActionStates((prev) => ({ ...prev, shared: !prev.shared }));
  //     setLocalCounts((prev) => ({
  //       ...prev,
  //       shares: prev.shares + (actionStates.shared ? -1 : 1),
  //     }));
  //     shareMutation.mutate(post.post_id);
  //   },
  //   [actionStates.shared, post.post_id, shareMutation]
  // );

  const handleRepost = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!isAuthenticated) {
        onAuthRequired?.();
        return;
      }

      const wasReposted = post.is_reposted || false; // 👈 TRẠNG THÁI TRƯỚC CLICK

      repostMutation.mutate({
        postId: post.post_id,
        wasReposted,
      });
    },
    [post.is_reposted, post.post_id, repostMutation, isAuthenticated]
  );

  const handleReply = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!isAuthenticated) {
        onAuthRequired?.();
        return;
      }
      if (onReply) {
        onReply(post, author);
      }
    },
    [post, author, onReply, isAuthenticated]
  );

  // Media Checks
  const hasGallery = post.gallery && post.gallery.length > 0;
  const hasSingleMedia = post.media_url && !hasGallery;
  const isYoutube = hasSingleMedia ? isYouTubeUrl(post.media_url!) : false;
  const embedUrl = isYoutube ? getYouTubeEmbedUrl(post.media_url!) : null;
  // Phát hiện media type chính xác
  const actualMediaType = hasSingleMedia
    ? isYoutube
      ? "youtube"
      : post.media_type
    : null;
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const blockMutation = useBlockUser();

  const handleBlockConfirm = () => {
    blockMutation.mutate(displayAuthor.uid, {
      onSuccess: () => {
        setShowBlockDialog(false);
      },
    });
  };

  // Delete State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteMutation = useDeletePost();

  const handleDelete = () => {
    deleteMutation.mutate(post.post_id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
      },
    });
  };

  // Debug Block Visibility
  const isAuthor = Boolean(
    me?.uid && displayAuthor?.uid && String(me.uid) === String(displayAuthor.uid)
  );
  // console.log("FeedCard Debug:", { meUid: me?.uid, authorUid: post.author?.uid, isAuthor, isAuthenticated });

  // Dropdown Actions
  const postActions = [
    {
      id: "bookmark",
      label: post.is_saved ? "Unsave" : "Save",
      icon: <Bookmark size={16} fill={post.is_saved ? "currentColor" : "none"} />,
      onClick: handleBookmark,
      isVisible: true,
      showSeparatorAfter: true,
    },
    {
      id: "edit",
      label: "Edit",
      icon: <Edit3 size={16} />,
      onClick: () => onEdit?.(post), // Pass post to parent's handler
      isVisible: isAuthor && !!onEdit,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: () => setShowDeleteDialog(true),
      isVisible: isAuthor,
      variant: "destructive" as const,
      showSeparatorAfter: true, // If we want
    },
    {
      id: "block",
      label: "Block",
      icon: <Ban size={16} />,
      onClick: () => setShowBlockDialog(true),
      isVisible: isAuthenticated && !isAuthor,
      showSeparatorAfter: true,
      variant: "destructive" as const,
    },
    {
      id: "copy-link",
      label: "Copy link",
      icon: <Link2 size={16} />,
      onClick: async () => {
        const postUrl = `${window.location.origin}/post/${post.post_id}`;
        try {
          await navigator.clipboard.writeText(postUrl);
          toast.success("Link copied to clipboard");
        } catch (err) {
          toast.error("Failed to copy link");
        }
      },
      isVisible: true,
    },
  ];

  return (
    <Card
      className={`w-full max-w-2xl bg-secondary text-foreground border-border mb-4 cursor-pointer transition-all duration-200 hover:bg-secondary/80 hover:shadow-lg ${className || ""
        }`}
      onClick={handleCardClick}
    >
      {/* Repost Indicator */}
      {post.is_repost_item && post.repost_info && (
        <div
          className="flex items-center gap-2 px-4 pt-1.5 pb-1 text-xs text-muted-foreground font-medium"
          onClick={(e) => e.stopPropagation()} // Stop propagation for the whole bar
        >
          <Repeat2 size={14} />
          <span
            className="hover:underline cursor-pointer"
            onClick={(e) => {
              // e.stopPropagation(); // Already handled by parent div
              if (post.repost_info?.reposted_by?.username) {
                navigate(`/profile/${post.repost_info.reposted_by.username}`);
              }
            }}
          >
            {post.repost_info.reposted_by?.username || "Someone"}
          </span>
          <span>
            reposted {formatRelativeTime(post.repost_info.reposted_at)}
          </span>
        </div>
      )}

      {/* HEADER */}
      <CardHeader
        className={`flex flex-row items-center gap-3 px-4 pb-0 ${post.is_repost_item ? "pt-0" : "-mt-3"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar
          className="w-10 h-10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
        >
          <AvatarImage
            src={
              isAuthor
                ? (me?.avatar_url || DEFAULT_AVATAR_URL)
                : displayAuthor?.avatar_url ||
                displayAuthor?.avatar ||
                DEFAULT_AVATAR_URL
            }
            alt={displayAuthor?.name || "User"}
          />
          <AvatarFallback>
            {(displayAuthor?.full_name || displayAuthor?.name || displayAuthor?.username || "?")
              .charAt(0)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text hover:underline cursor-pointer text-foreground"
              onClick={handleProfileClick}
            >
              {displayAuthor?.full_name || displayAuthor?.name || displayAuthor?.username || "Unknown User"}
            </span>
            <span
              className="text-text-secondary text-ft hover:underline cursor-pointer"
              onClick={handleProfileClick}
            >
              {displayAuthor?.handle || ""}
            </span>
            <span className="text-text-muted text-xs">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>
        {/* Bọc Dropdown để chặn click */}
        {!compact && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownExtend
              actions={postActions}
              triggerType="icon"
              align="center"
            />
          </div>
        )}
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="py-0 pb-0 flex gap-3 px-4 -mt-4">
        <div className="spacer-column"></div>
        <div
          className="flex-1 min-w-0"
          onClick={handleContentClick}
          ref={(el) => {
            if (el) {
              const updateDragRef = () => {
                const gallery = el.querySelector('[data-gallery="true"]');
                if (gallery) {
                  // Gallery scroll container will be updated from Gallery component
                  gallery.querySelector('[data-scroll-container="true"]');
                }
              };
              updateDragRef();
            }
          }}
        >
          {post.content && (
            <p className="text-sm leading-relaxed text-foreground whitespace-normal mb-1 wrap-break-words">
              <TextWithMentions content={post.content} />
            </p>
          )}

          {hasGallery ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Gallery
                items={post.gallery!}
                onDragStateChange={setIsGalleryDragging}
                size={"small"}
                hideBorder={hideBorder}
              />
            </div>
          ) : (
            hasSingleMedia && (
              <>
                <div
                  className="rounded-lg overflow-hidden mt-2 w-fit cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    setShowSingleMediaLightbox(true);
                  }}
                >
                  {isYoutube ? (
                    <div
                      className="relative w-full bg-black"
                      style={{ paddingBottom: "56.25%" }}
                    >
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
                      className="media-content max-h-96 w-full object-cover"
                      src={post.media_url!}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    />
                  ) : (
                    <img
                      src={post.media_url!}
                      alt="Post media"
                      className="media-content max-h-96 w-full h-auto object-contain object-left"
                      loading="lazy"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowSingleMediaLightbox(true);
                      }}
                    />
                  )}
                </div>

                {showSingleMediaLightbox && (
                  <MediaLightbox
                    open={showSingleMediaLightbox}
                    onClose={() => setShowSingleMediaLightbox(false)}
                    src={post.media_url!}
                    type={isYoutube ? "youtube" : actualMediaType as any}
                  />
                )}
              </>
            )
          )}
        </div>
        <div className="spacer-column"></div>
      </CardContent>

      {/* FOOTER */}
      {!compact && (
        <CardFooter
          className="flex gap-3 px-4 -pb-3 -mb-3 -pt-10 -mt-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="spacer-column"></div>
          <div className="flex-1 flex gap-4 justify-start">
            <ActionButton
              actionId="like"
              icon={<Heart size={24} />}
              count={post.likes_count || 0}
              onClick={handleLike}
              isActive={post.is_liked}
            />
            <ActionButton
              actionId="reply"
              icon={<MessageSquare size={24} />}
              count={post.comments_count || 0}
              onClick={handleReply}
            />
            <ActionButton
              actionId="bookmark"
              icon={<Bookmark size={24} />}
              count={post.saves_count || 0}
              onClick={handleBookmark}
              isActive={post.is_saved}
            />
            <ActionButton
              actionId="repost"
              icon={<Repeat2 size={24} />}
              count={post.reposts_count || 0}
              onClick={handleRepost}
              isActive={post.is_reposted}
            />
            <ActionButton
              actionId="share"
              icon={<Send size={24} />}
              onClick={handleExternalShare}
            />
          </div>
          <div className="spacer-column"></div>
        </CardFooter>
      )}
      {/* Block User Dialog */}
      <BlockUserDialog
        isOpen={showBlockDialog}
        onClose={() => setShowBlockDialog(false)}
        onConfirm={handleBlockConfirm}
        username={displayAuthor.username}
        avatarUrl={displayAuthor.avatar_url}
        isPending={blockMutation.isPending}
      />

      {/* Login Prompt Overlay */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            setShowLoginPrompt(false);
          }}
        >
          <div
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <LoginPrompt />
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <DeletePostDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </Card>
  );
};

export default FeedCard;
