//Kiệt
import React, { useState, useCallback } from "react";
import { ActionButton } from "./ActionButton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { LoginPrompt } from "@/components/LoginPrompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  MessageSquare,
  Bookmark,
  Repeat2,
  Heart,
  Send,
  X,
  Edit3,
  Ban,
  Link2,
} from "lucide-react";
import { DropdownExtend } from "./DropdownExtend";
import { useNavigate } from "react-router-dom";
import {
  useLikePost,
  useSavePost,
  useRepostPost,
} from "@/hooks/api/use-posts";
import { useAuth } from "@/contexts/AuthProvider";

import type { Post as PostData, Author as AuthorData } from "@/types/post";

import { downloadMedia } from "@/services/api";
import { toast } from "sonner";

interface FeedCardProps {
  post: PostData;
  author: AuthorData;
  onReply?: (post: PostData, author: AuthorData) => void;
  onEdit?: (post: PostData) => void;
  className?: string;
  compact?: boolean;
  hideBorder?: boolean;
}


// Helper Functions
const formatTime = (isoString: string): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch (e) {
    return "";
  }
};

// --- IMPORTED GALLERY COMPONENT ---
// Gallery logic moved to ./Gallery.tsx
// --- IMPORTED GALLERY COMPONENT ---
// Gallery logic moved to ./Gallery.tsx
import { Gallery, getYouTubeEmbedUrl, isYouTubeUrl } from "./Gallery";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

// --- MAIN FEED CARD COMPONENT ---
const FeedCard: React.FC<FeedCardProps> = ({ post, author, onReply, onEdit, className, compact, hideBorder }) => {
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSingleMediaLightbox, setShowSingleMediaLightbox] = useState(false);
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();

  const repostMutation = useRepostPost();
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);

  // Optimistic UI State - khởi tạo từ props
  // const [localCounts, setLocalCounts] = useState({
  //   likes: post.likes_count || 0,
  //   replies: post.comments_count || 0,
  //   bookmarks: post.saves_count || 0,
  //   reposts: post.reposts_count || 0,
  // });

  // const [actionStates, setActionStates] = useState({
  //   liked: post.is_liked || false,
  //   bookmarked: post.is_saved || false,
  //   reposted: post.is_reposted || false,
  // });


  // --- Xử lý click chuyển trang ---
  const handleCardClick = () => {
    if (isGalleryDragging) return;

    // Nếu người dùng đang bôi đen text thì không chuyển trang
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    navigate(`/post/${post.post_id}`);
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
        setShowLoginPrompt(true);
        return;
      }
      likeMutation.mutate(post.post_id);
    },
    [post.post_id, likeMutation, isAuthenticated]
  );

  const handleDownloadMedia = (
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    if (!post.media_url) {
      toast.error("No media to download");
      return;
    }

    const downloadUrl =
      "http://localhost:8000/api/media/download?url=" +
      encodeURIComponent(post.media_url);

    window.location.href = downloadUrl;
  };

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
        setShowLoginPrompt(true);
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
        setShowLoginPrompt(true);
        return;
      }

      const wasReposted = post.is_reposted || false;

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
        setShowLoginPrompt(true);
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
      onClick: () => onEdit?.(post),
      isVisible: me?.uid === displayAuthor?.uid && !!onEdit,
    },
    {
      id: "block",
      label: "Block",
      icon: <Ban size={16} />,
      onClick: () => console.log("Block post", post.post_id),
      isVisible: post.author_id !== "currentUserId",
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
      className={`w-full max-w-2xl bg-secondary text-foreground border-border mb-4 cursor-pointer transition-all duration-200 hover:bg-secondary/80 hover:shadow-lg ${className || ""}`}
      onClick={handleCardClick} // Gắn sự kiện click vào đây
    >
      {/* HEADER */}
      <CardHeader
        className="flex flex-row items-center gap-3 px-4 -mt-3 pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage
            src={displayAuthor?.avatar_url || displayAuthor?.avatar || DEFAULT_AVATAR_URL}
            alt={displayAuthor?.name || "User"}
          />
          <AvatarFallback>
            {displayAuthor?.name
              ? displayAuthor.name.charAt(0).toUpperCase()
              : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text hover:underline cursor-pointer text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                console.log("Go to profile");
              }}
            >
              {displayAuthor?.name || "Unknown User"}
            </span>
            <span className="text-text-secondary text-ft">
              {displayAuthor?.handle || ""}
            </span>
            <span className="text-text-muted text-xs">
              {formatTime(post.created_at)}
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
              {post.content}
            </p>
          )}

          {hasGallery ? (
            <Gallery
              items={post.gallery!}
              onDragStateChange={setIsGalleryDragging}
              size={"small"}
              hideBorder={hideBorder}
            />
          ) : (
            hasSingleMedia && (
              <>
                <div
                  className="rounded-lg overflow-hidden mt-2 w-fit cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
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
                    />
                  ) : (
                    <img
                      src={post.media_url!}
                      alt="Post media"
                      className="media-content max-h-96 w-full h-auto object-contain object-left"
                      loading="lazy"
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
                    <button
                      onClick={handleDownloadMedia}
                      className="absolute top-4 right-15 bg-black/70 text-white px-4 py-2 rounded-lg hover:bg-black transition z-50"
                    >
                      ⬇ Download
                    </button>
                    {isYoutube ? (
                      <div
                        className="relative w-full max-w-4xl bg-black"
                        style={{ paddingBottom: "56.25%" }}
                      >
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
                        src={post.media_url!}
                      />
                    ) : (
                      <img
                        src={post.media_url!}
                        alt="Post media lightbox"
                        className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                      />
                    )}
                  </div>
                )}
              </>
            )
          )}
        </div>
        <div className="spacer-column"></div>
      </CardContent>

      {/* FOOTER */}
      {!compact && (
        <CardFooter className="flex gap-3 px-4 -pb-3 -mb-3 -pt-10 -mt-5">
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
            // count={localCounts.shares}
            // onClick={handleShare}
            // isActive={actionStates.shared}
            />
          </div>
          <div className="spacer-column"></div>
        </CardFooter>
      )}
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
    </Card>
  );
};

export default FeedCard;
