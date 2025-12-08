// Trang này sẽ là trang home luôn
import FeedCard from "@/components/FeedCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import type { PostData, AuthorData, MediaItem } from "@/components/FeedCard";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const postsRef = useRef<any[]>([]);

  const {
    data: postsData,
    isLoading: isPostsLoading,
    error: postsError,
  } = usePosts();

  // Transform API data to add author object
  const transformedPosts = Array.isArray(postsData)
    ? postsData.map((post: any) => ({
        ...post,
        media_url: post.link_url?.[0] || null,
        media_type: post.link_url?.[0] ? "image" : null,
        gallery:
          post.link_url && post.link_url.length > 1
            ? post.link_url.map((url: string) => ({
                url,
                type: "image" as const,
              }))
            : undefined,
        actions_count: post.likeCount || 0,
        replies_count: post.commentCount || 0,
        bookmark_count: post.saveCount || 0,
        shares_count: post.shareCount || 0,
        author: {
          id: post.author_id,
          name: "User",
          handle: "@user",
          avatar:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.author_id,
        },
      }))
    : [];

  // Update ref when data changes
  useEffect(() => {
    postsRef.current = transformedPosts;
  }, [transformedPosts]);

  // Debug API Response
  useEffect(() => {
    console.log("=== TRANSFORMED DATA ===");
    console.log("transformedPosts:", transformedPosts);
    console.log("========================");
  }, [transformedPosts]);

  // Lấy data từ API
  const { data: postsData, isLoading, isError } = usePosts();

  // Load more posts function
  const loadMorePosts = useCallback(() => {
    if (isLoadingMore || !hasMore || !postsRef.current.length) return;

    setIsLoading(true);
    setTimeout(() => {
      const startIndex = currentPage * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      const newPosts = postsRef.current.slice(startIndex, endIndex);

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedPosts((prev) => [...prev, ...newPosts]);
        setCurrentPage((prev) => prev + 1);
      }
      setIsLoading(false);
    }, 300);
  }, [currentPage, postsPerPage, isLoading, hasMore]);

  // Initial load
  useEffect(() => {
    if (
      !isPostsLoading &&
      postsRef.current.length > 0 &&
      displayedPosts.length === 0
    ) {
      loadMorePosts();
    }
  }, [isPostsLoading, displayedPosts.length, loadMorePosts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoading
        ) {
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
  }, [loadMorePosts, hasMore, isLoadingMore, isLoading]);

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
      id: post.id,
      content: post.content,
      date: post.created_at,
      user: {
        id: author.id || post.author_id,
        username: author.username || author.handle.replace("@", ""),
        name: author.name,
        avatarUrl: author.avatar,
      },
    });
    setIsReplyOpen(true);
  };

  // Transform API data về format FeedCard
  const transformPost = (apiPost: any) => {
    // Chuyển link_url thành gallery
    let gallery: MediaItem[] | undefined;
    if (apiPost.link_url && apiPost.link_url.length > 0) {
      gallery = apiPost.link_url.map((url: string) => {
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
      id: apiPost.id,
      content: apiPost.content,
      created_at: apiPost.created_at,
      author_id: apiPost.author_id,
      media_url: gallery && gallery.length === 1 ? gallery[0].url : null,
      media_type: gallery && gallery.length === 1 ? gallery[0].type : null,
      gallery: gallery && gallery.length > 1 ? gallery : undefined,
      actions_count: apiPost.likeCount || 0,
      replies_count: apiPost.commentCount || 0,
      bookmark_count: apiPost.saveCount || 0,
      shares_count: apiPost.shareCount || 0,
      reposts_count: apiPost.repostCount || 0,
      is_liked: apiPost.is_liked || false,
      is_bookmarked: apiPost.is_saved || false,
      is_shared: apiPost.is_shared || false,
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
                  key={`post-${item.id}-${index}`}
                  post={{
                    id: item.id,
                    content: item.content,
                    created_at: item.created_at,
                    author_id: item.author_id,
                    media_url: item.media_url,
                    media_type: item.media_type,
                    gallery: item.gallery,
                    actions_count: item.actions_count,
                    replies_count: item.replies_count,
                    bookmark_count: item.bookmark_count,
                    shares_count: item.shares_count,
                    reposts_count: item.reposts_count,
                    is_liked: item.is_liked,
                    is_bookmarked: item.is_bookmarked,
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
          currentUser={{
            id: currentUser.id,
            username: currentUser.username,
            name: currentUser.name,
            avatarUrl: (currentUser as any).avatar || "",
          }}
          targetPost={replyTarget}
          mockFriends={[]}
          onPost={() => {}}
        />
      )}
    </div>
  );
};

export default Feed;
