// Trang này sẽ là trang home luôn
import FeedCard from "@/components/FeedCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import type { Post as PostData, Author as AuthorData, TargetPost } from "@/types/post";
// import type { MediaItem } from "@/types/common";
import { useEffect, useState, useRef, useCallback } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthProvider";
import ReplyCommentDialog from "@/components/comment";
// import { type TargetPost } from "@/components/comment";
import { usePosts } from "@/hooks/api/use-posts";
import EditPostDialog from "@/components/EditPostDialog";
import { MOCK_FRIENDS } from "@/MockData/data";


// --- BẮT ĐẦU: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---

// --- KẾT THÚC: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { useSearchParams } from "react-router-dom";

const Feed = () => {
  const [isLoginPromptDismissed] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { isAuthenticated, user: currentUser } = useAuth();

  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<TargetPost | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  // ... (in component)
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";

  // Lấy data từ API
  const {
    data: postsData,
    isLoading,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = usePosts(filter);

  // Flatten logic
  const allPosts = postsData?.pages.flat() || [];

  // Load more posts function
  const loadMorePosts = useCallback(() => {
    if (!isLoading && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
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
  }, [loadMorePosts, hasNextPage, isFetchingNextPage]);

  // Reset displayedCount when postsData changes
  // Removed local displayedCount effect


  const handleReply = (post: PostData, author: AuthorData) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
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
        uid: author.uid || post.author_id,
        username: author.username,
        full_name: author.name || author.full_name || null,
        avatar_url: author.avatar_url || DEFAULT_AVATAR_URL,
      },
      media_url: post.media_url,
      media_type: post.media_type,
      gallery: post.gallery,
    });
    setIsReplyOpen(true);
  };

  // Transform API data về format FeedCard
  const transformPost = (apiPost: any) => {
    // Chuyển media_urls thành gallery
    // Logic for media
    let gallery: string[] | undefined;
    let singleMediaUrl: string | null = null;
    let singleMediaType: string | null = null;

    if (apiPost.media_urls && apiPost.media_urls.length > 0) {
      if (apiPost.media_urls.length > 1) {
        gallery = apiPost.media_urls;
      } else {
        // Single media case
        const url = apiPost.media_urls[0];
        singleMediaUrl = url;

        const isYoutube = /(?:youtube\.com|youtu\.be)/.test(url);
        const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
        singleMediaType = isYoutube ? "youtube" : isVideo ? "video" : "image";
      }
    }

    return {
      post_id: apiPost.post_id,
      content: apiPost.content,
      created_at: apiPost.created_at,
      author_id: apiPost.author_id,
      media_url: singleMediaUrl,
      media_type: singleMediaType,
      gallery: gallery,
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
        id: apiPost.author?.uid || apiPost.author_id,
        uid: apiPost.author?.uid || apiPost.author_id,
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
        avatar_url:
          apiPost.author?.avatar_url ||
          apiPost.author?.avatar ||
          DEFAULT_AVATAR_URL,
        /** @deprecated */
        avatar:
          apiPost.author?.avatar_url ||
          apiPost.author?.avatar ||
          DEFAULT_AVATAR_URL,
      },
    };
  };
  // Transform và slice posts theo displayedCount
  // Transform tất cả posts
  const displayedPosts = allPosts.map(transformPost);


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
                <LoginPrompt
                  title="Log in or sign up for Sợi Chỉ City"
                  subtitle={<>See what people are talking <br /> about and join the conversation.</>}
                />
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
                  onEdit={(post) => {
                    setEditingPost(post);
                    setIsEditOpen(true);
                  }}
                />
              ))}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {(isLoading || isFetchingNextPage) && <LoadingSpinner />}
              {!hasNextPage && displayedPosts.length > 0 && (
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

      {
        showLoginPrompt && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowLoginPrompt(false)}
          >
            <div
              className="relative w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <LoginPrompt />
            </div>
          </div>
        )
      }

      {
        replyTarget && currentUser && (
          <ReplyCommentDialog
            open={isReplyOpen}
            onOpenChange={setIsReplyOpen}
            currentUser={currentUser}
            targetPost={replyTarget}
            mockFriends={MOCK_FRIENDS}
          />
        )
      }

      {/* Edit Dialog */}
      {isEditOpen && editingPost && (
        <EditPostDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          post={editingPost}
        />
      )}
    </div >
  );
};

export default Feed;

