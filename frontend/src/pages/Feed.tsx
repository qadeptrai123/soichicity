// Trang này sẽ là trang home luôn
import FeedCard from "@/components/FeedCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import type { PostData, AuthorData, MediaItem } from "@/components/FeedCard";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import ReplyCommentDialog, { type TargetPost } from "@/components/comment";
import { usePosts } from "@/hooks/api/use-posts";
import { MOCK_FRIENDS } from "@/MockData/data";

// --- BẮT ĐẦU: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---

// --- KẾT THÚC: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---

const Feed = () => {
  const [isLoginPromptDismissed, setIsLoginPromptDismissed] = useState(false);
  const { isAuthenticated, user: currentUser } = useAuth();

  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<TargetPost | null>(null);

  // Infinite scroll states
  const [displayedCount, setDisplayedCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Lấy data từ API
  const { data: postsData, isLoading, error: postsError } = usePosts();
  // Load more posts function
  const loadMorePosts = useCallback(() => {
    if (isLoading || !hasMore) return;

    setTimeout(() => {
      setDisplayedCount((prev) => {
        const newCount = prev + 10;
        const allPosts = Array.isArray(postsData) ? postsData : [];
        if (newCount >= allPosts.length) setHasMore(false);
        return newCount;
      });
    }, 300);
  }, [postsData, isLoading, hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMorePosts, hasMore, isLoading]);

  // Reset displayedCount when postsData changes
  useEffect(() => {
    if (postsData && Array.isArray(postsData)) {
      setDisplayedCount(10);
      setHasMore(postsData.length > 10);
    }
  }, [postsData]);

  const handleReply = (post: PostData, author: AuthorData) => {
    if (!isAuthenticated) {
      // TODO: Show login prompt
      return;
    }

    if (!currentUser) {
      return;
    }
    setReplyTarget({
      id: post.post_id,
      content: post.content,
      date: post.created_at,
      user: {
        uid: author.id || post.author_id,
        username: author.username || author.handle.replace("@", ""),
        full_name: author.name,
        avatar_url: author.avatar,
      },
    });
    setIsReplyOpen(true);
  };

  // Transform API data về format FeedCard
  const transformPost = (apiPost: any) => {
    // Chuyển media_urls thành gallery
    let gallery: MediaItem[] | undefined;
    if (apiPost.media_urls && apiPost.media_urls.length > 0) {
      gallery = apiPost.media_urls.map((url: string) => {
        // Phát hiện kiểu media
        const isYoutube = /(?:youtube\.com|youtu\.be)/.test(url);
        const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
        return {
          url,
          type: isYoutube ? "youtube" : isVideo ? "video" : "image",
        } as MediaItem;
      });
    }

    return {
      post_id: apiPost.post_id,
      content: apiPost.content,
      created_at: apiPost.created_at,
      author_id: apiPost.author_id,
      media_url: gallery && gallery.length === 1 ? gallery[0].url : null,
      media_type: gallery && gallery.length === 1 ? gallery[0].type : null,
      gallery: gallery && gallery.length > 1 ? gallery : undefined,
      likes_count: apiPost.likes_count || 0,
      comments_count: apiPost.comments_count || 0,
      saves_count: apiPost.saves_count || 0,
      reposts_count: apiPost.reposts_count || 0, // Maps api reposts_count -> reposts_count
      shares_count: apiPost.reposts_count || 0, // Legacy support if needed

      is_liked: apiPost.is_liked || false,
      is_saved: apiPost.is_saved || false,
      is_shared: apiPost.is_shared || false, // Should this be removed? Backend: legacy support 
      is_reposted: apiPost.is_reposted || false,
      author: {
        id: apiPost.author?.id || apiPost.author_id,
        username:
          apiPost.author?.username ||
          "user" + apiPost.author_id?.substring(0, 6),
        name:
          apiPost.author?.full_name ||
          apiPost.author?.name ||
          apiPost.author?.username ||
          "Anonymous",
        handle: apiPost.author?.username
          ? `@${apiPost.author.username}`
          : "@anonymous",
        avatar:
          apiPost.author?.avatar ||
          apiPost.author?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiPost.author_id}`,
      },
    };
  };
  // Transform và slice posts theo displayedCount
  const allTransformedPosts = Array.isArray(postsData)
    ? postsData.map(transformPost)
    : [];
  console.log(allTransformedPosts)
  const displayedPosts = allTransformedPosts.slice(0, displayedCount);

  return (
    <div className="bg-backgroundfeed min-h-screen p-4">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Empty left column for spacing */}
        <div className="hidden lg:block"></div>

        {/* Feed Posts - Center */}
        <div className="lg:col-span-2">
          {/* Mobile Login Prompt - Top */}
          {!isAuthenticated && !isLoginPromptDismissed && (
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4 flex justify-center">
              <div className="w-full max-w-sm">
                <LoginPrompt onClose={() => setIsLoginPromptDismissed(true)} />
              </div>
            </div>
          )}

          <div className="space-y-4 pt-[140px] lg:pt-0">
            {postsError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                Error loading posts. Please try again later.
              </div>
            )}

            {!isLoading &&
              displayedPosts.length > 0 &&
              displayedPosts.map((item, index) => (
                <FeedCard
                  key={`post-${item.post_id}-${index}`}
                  post={{
                    post_id: item.post_id,
                    content: item.content,
                    created_at: item.created_at,
                    author_id: item.author_id,
                    media_url: item.media_url,
                    media_type: item.media_type,
                    gallery: item.gallery,
                    likes_count: item.likes_count,
                    comments_count: item.comments_count,
                    saves_count: item.saves_count,
                    shares_count: item.shares_count,
                    reposts_count: item.reposts_count,
                    is_liked: item.is_liked,
                    is_saved: item.is_saved,
                    is_shared: item.is_shared,
                    is_reposted: item.is_reposted,
                  }}
                  author={item.author}
                  onReply={handleReply}
                />
              ))}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                </div>
              )}
              {!hasMore && displayedPosts.length > 0 && (
                <p className="text-text-muted text-sm">No more posts to load</p>
              )}
            </div>
          </div>
        </div>

        {/* Login Prompt - Right Column (Desktop only) */}
        {!isAuthenticated && (
          <div className="hidden lg:block lg:col-span-1 w-full">
            <div className="sticky top-20">
              <LoginPrompt />
            </div>
          </div>
        )}
      </div>

      {replyTarget && currentUser && (
        <ReplyCommentDialog
          open={isReplyOpen}
          onOpenChange={setIsReplyOpen}
          currentUser={currentUser}
          targetPost={replyTarget}
          mockFriends={MOCK_FRIENDS}
        />
      )}
    </div>
  );
};

export default Feed;
