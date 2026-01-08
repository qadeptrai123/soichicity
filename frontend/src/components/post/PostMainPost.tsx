import { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Send, Bookmark, X } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { useLikePost, useSavePost, useRepostPost } from "@/hooks/api/use-posts";
import { Gallery, getYouTubeEmbedUrl, isYouTubeUrl } from "../Gallery";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import type { Post } from "@/types/post";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthProvider";
import { LoginPrompt } from "@/components/LoginPrompt";
// import type { MediaItem } from "@/types/common";
import { toast } from "sonner";


interface PostMainPostProps {
  data: Post;
  onViewActivity: () => void;
  onReply?: () => void;
}

export const PostMainPost = ({ data, onViewActivity, onReply }: PostMainPostProps) => {
  // Hàm format thời gian giả lập (hoặc dùng thư viện date-fns nếu có)
  const timeAgo = formatDistanceToNow(new Date(data.created_at));

  // Hooks
  const { isAuthenticated } = useAuth();
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const repostMutation = useRepostPost();

  // State
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSingleMediaLightbox, setShowSingleMediaLightbox] = useState(false);
  const [, setIsGalleryDragging] = useState(false);

  // Optimistic UI State
  const [localCounts, setLocalCounts] = useState({
    likes: data.likes_count || 0,
    replies: data.comments_count || data.replies?.length || 0,
    bookmarks: data.saves_count || 0,
    reposts: data.reposts_count || 0,
  });

  const [actionStates, setActionStates] = useState({
    liked: data.is_liked || false,
    bookmarked: data.is_saved || false,
    reposted: data.is_reposted || false,
  });

  useEffect(() => {
    setLocalCounts({
      likes: data.likes_count || 0,
      replies: data.comments_count || data.replies?.length || 0,
      bookmarks: data.saves_count || 0,
      reposts: data.reposts_count || 0,
    });
    setActionStates({
      liked: data.is_liked || false,
      bookmarked: data.is_saved || false,  // Note: API field is_saved or is_bookmarked? Schema says is_saved
      reposted: data.is_reposted || false    // Schema says is_reposted, usePostDetail data might differ. Let's assume passed data alignment.
    });
  }, [data]);

  const handleLike = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setActionStates((prev) => ({ ...prev, liked: !prev.liked }));
    setLocalCounts((prev) => ({
      ...prev,
      likes: prev.likes + (actionStates.liked ? -1 : 1),
    }));
    likeMutation.mutate(data.post_id);
  }, [actionStates.liked, data.post_id, likeMutation, isAuthenticated]);

  const handleShare = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
  
    const postUrl = `${window.location.origin}/post/${data.post_id}`;
    const shareData = {
      title: "Check out this post",
      text: data.content?.slice(0, 100) || "Interesting post",
      url: postUrl,
    };
  
    // ✅ Ưu tiên Web Share API (mobile, Chrome, Safari)
    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        // user cancel → không cần báo lỗi
      });
    } else {
      // 💻 Fallback: copy link
      navigator.clipboard.writeText(postUrl)
        .then(() => {
          toast.success("Post link copied");
        })
        .catch(() => {
          toast.error("Failed to copy link");
        });
    }
  }, [data.post_id, data.content]);
  

  const handleBookmark = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setActionStates((prev) => ({ ...prev, bookmarked: !prev.bookmarked }));
    setLocalCounts((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks + (actionStates.bookmarked ? -1 : 1),
    }));
    saveMutation.mutate({
      postId: data.post_id,
      wasSaved: actionStates.bookmarked,
    });
    
  }, [actionStates.bookmarked, data.post_id, saveMutation, isAuthenticated]);

  const handleRepost = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setActionStates((prev) => ({ ...prev, reposted: !prev.reposted }));
    setLocalCounts((prev) => ({
      ...prev,
      reposts: prev.reposts + (actionStates.reposted ? -1 : 1),
    }));
    repostMutation.mutate({
      postId: data.post_id,
      wasReposted: actionStates.reposted,
    });
    
  }, [actionStates.reposted, data.post_id, repostMutation, isAuthenticated]);

  const handleReply = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    onReply?.();
  }, [onReply, isAuthenticated]);

  // --- Preprocess Gallery Data (similar to Feed.tsx) ---
  const processedData = useMemo(() => {
    let gallery: string[] | undefined;

    // Priority 1: data.gallery (already processed)
    if (data.gallery && data.gallery.length > 0) {
      if (typeof data.gallery[0] === 'string') {
        gallery = data.gallery;
      } else if (typeof data.gallery[0] === 'object' && (data.gallery[0] as any).url) {
        gallery = data.gallery.map((item: any) => item.url);
      }
    }
    // Priority 2: data.media_urls (string array)
    else if (data.media_urls && data.media_urls.length > 0) {
      gallery = data.media_urls;
    }

    // Determine finalized props based on Feed.tsx logic
    // If > 1 item, it's a gallery. If 1 item, it's single media.
    const finalGallery = gallery && gallery.length > 1 ? gallery : undefined;
    const finalMediaUrl = gallery && gallery.length === 1 ? gallery[0] : (data.media_url || null);

    let finalMediaType = data.media_type || null;
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
  }, [data]);

  // Check based on processed data
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
    <div className="p-6 pb-6 text-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 items-center">
          <Avatar className="w-12 h-12 border border-[#374151]">
            <AvatarImage src={data.author?.avatar_url || DEFAULT_AVATAR_URL} />
            <AvatarFallback>{data.author?.full_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg leading-tight text-white">{data.author?.full_name}</span>
              <span className="text-[#64748b] text-base">@{data.author?.username}</span>

              {/* THÊM THỜI GIAN Ở ĐÂY */}
              <span className="text-[#64748b] text-sm flex items-center gap-1">
                <span className="text-[10px]">•</span> {timeAgo}
              </span>
            </div>
          </div>
        </div>
        <button
          className="text-[#94a3b8] hover:text-white p-2 rounded-full hover:bg-white/10"
          onClick={onViewActivity}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="text-[17px] leading-7 whitespace-pre-wrap mb-6 font-normal text-[#f1f5f9]">
        {data.content}
      </div>

      {hasGallery ? (
        <div className="mb-4">
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
              className="rounded-lg overflow-hidden mt-2 mb-4 w-fit cursor-pointer border border-[#374151]"
              onClick={(e) => {
                e.stopPropagation();
                setShowSingleMediaLightbox(true);
              }}
            >
              {isYoutube ? (
                <div
                  className="relative w-full bg-black min-w-[500px]"
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
                  className="media-content max-h-[600px] w-full object-cover"
                  src={processedData.media_url!}
                />
              ) : (
                <img
                  src={processedData.media_url!}
                  alt="Post media"
                  className="media-content max-h-[600px] w-full h-auto object-contain object-left"
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
                    src={processedData.media_url!}
                  />
                ) : (
                  <img
                    src={processedData.media_url!}
                    alt="Post media lightbox"
                    className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                  />
                )}
              </div>
            )}
          </>
        )
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-6 text-[#94a3b8] pt-2">
        <ActionButton
          actionId="like"
          icon={<Heart size={20} />}
          count={localCounts.likes}
          onClick={handleLike}
          isActive={actionStates.liked}
        />
        <ActionButton
          actionId="reply"
          icon={<MessageCircle size={20} />}
          count={localCounts.replies}
          onClick={handleReply}
        />
        <ActionButton
          actionId="bookmark"
          icon={<Bookmark size={20} />}
          count={localCounts.bookmarks}
          onClick={handleBookmark}
          isActive={actionStates.bookmarked}
        />
        <ActionButton
          actionId="repost"
          icon={<Repeat2 size={20} />}
          count={localCounts.reposts}
          onClick={handleRepost}
          isActive={actionStates.reposted}
        />
        <ActionButton
          actionId="share"
          icon={<Send size={20} />}
          onClick={handleShare}
        />
        {/* Add Bookmark for Main Post too if desired, usually it is there */}

      </div>

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
    </div>
  );
};