// Trang này sẽ là trang home luôn
import FeedCard from "@/components/FeedCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import type { PostData, AuthorData, MediaItem } from "@/components/FeedCard";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import ReplyCommentDialog, { type TargetPost } from "@/components/comment";
import { usePosts } from "@/hooks/api/use-posts";

// --- BẮT ĐẦU: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---

// Danh sách tác giả giả
const mockAuthors = [
  { name: "John Doe", handle: "@johndoe", avatarSeed: "John" },
  { name: "Jane Smith", handle: "@janesmith", avatarSeed: "Jane" },
  { name: "Alex Johnson", handle: "@alexj", avatarSeed: "Alex" },
  { name: "Sarah Connor", handle: "@sarahc", avatarSeed: "Sarah" },
  { name: "Michael Scott", handle: "@mscott", avatarSeed: "Michael" },
  { name: "Dwight Schrute", handle: "@dwights", avatarSeed: "Dwight" },
  { name: "Pam Beesly", handle: "@pamb", avatarSeed: "Pam" },
  { name: "Jim Halpert", handle: "@jimh", avatarSeed: "Jim" },
  { name: "Leslie Knope", handle: "@lesliek", avatarSeed: "Leslie" },
  { name: "Ron Swanson", handle: "@rons", avatarSeed: "Ron" },
];

// URLs video YouTube
const youtubePlaceholders = [
  "https://www.youtube.com/watch?v=Oz8RF_1eGxw",
  "https://www.youtube.com/watch?v=eMW9ZxXxCHI",
  "https://www.youtube.com/watch?v=8STFDAO7UEQ",
  "https://www.youtube.com/watch?v=mnBAZ-VkuEg",
  "https://www.youtube.com/watch?v=3bJkVSMs4dw",
];

// URLs ảnh placeholder (giữ nguyên)
const imagePlaceholders = [
  "https://images.pexels.com/photos/1486974/pexels-photo-1486974.jpeg?cs=srgb&dl=pexels-james-wheeler-1486974.jpg&fm=jpg",
  "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg?cs=srgb&dl=pexels-pixabay-414171.jpg&fm=jpg",
  "https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg?cs=srgb&dl=pexels-lukas-736230.jpg&fm=jpg",
  "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?cs=srgb&dl=pexels-andrea-piacquadio-1108099.jpg&fm=jpg",
  "https://images.pexels.com/photos/210647/pexels-photo-210647.jpeg?cs=srgb&dl=pexels-pixabay-210647.jpg&fm=jpg",
  "https://images.pexels.com/photos/34950/pexels-photo.jpg?cs=srgb&dl=pexels-pixabay-34950.jpg&fm=jpg",
];

// Nội dung bài đăng giả (giữ nguyên)
const textContent = [
  "Just finished an amazing project! Feeling super accomplished. What are you all working on?",
  "Loving the new features in the latest update. It really streamlines the workflow!",
  "A little behind-the-scenes look at my workspace today. Productivity is key! 💻",
  "Thoughts on the latest tech trends? Are we ready for the next big thing?",
  "Travel goals: Where should I go next? Drop your best recommendations below! 🌍",
  "Sometimes you just need a good cup of coffee to get through the day. ☕",
  "Experimenting with new recipes this weekend. Wish me luck! 🍲",
  'Found this incredible quote today: "The only way to do great work is to love what you do." - Steve Jobs',
  "Nature walk was exactly what I needed to clear my head. Highly recommend taking a break!",
  "Excited to announce my new product launch next week! Stay tuned for more details.",
  "Just watched a great documentary. Mind blown! 🤯",
  "Coding late tonight. The debugger is my best friend (and worst enemy).",
  "Throwback to a great vacation. Missing the sun and the beach! 🏖️",
  "Learning a new programming language. Any tips for a beginner?",
  "Happy Friday, everyone! What are your weekend plans?",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMedia(id: number): {
  media_url: string | null;
  media_type?: "image" | "video";
  gallery?: MediaItem[];
} {
  const mediaTypeRoll = id % 6;
  if (mediaTypeRoll === 0) {
    return { media_url: null };
  } else if (mediaTypeRoll === 1) {
    return { media_url: getRandomItem(imagePlaceholders), media_type: "image" };
  } else if (mediaTypeRoll === 2 || mediaTypeRoll === 4) {
    return {
      media_url: getRandomItem(youtubePlaceholders),
      media_type: "video",
    };
  } else {
    // Gallery with multiple images
    const galleryCount = 2 + Math.floor(Math.random() * 3); // 2-4 images
    const gallery: MediaItem[] = [];
    for (let i = 0; i < galleryCount; i++) {
      gallery.push({
        url: getRandomItem(imagePlaceholders),
        type: "image",
      });
    }
    return { media_url: null, gallery };
  }
}

function getRandomDate(index: number): string {
  const now = Date.now();
  const hoursAgo = index * 2 + Math.floor(Math.random() * 4);
  return new Date(now - hoursAgo * 3600000).toISOString();
}

function getRandomCounts() {
  return {
    actions_count: Math.floor(Math.random() * 500),
    replies_count: Math.floor(Math.random() * 100),
    bookmark_count: Math.floor(Math.random() * 200),
    shares_count: Math.floor(Math.random() * 50),
  };
}

const mockPosts: (PostData & { author: AuthorData })[] = [];
const totalPosts = 32;

for (let i = 1; i <= totalPosts; i++) {
  const randomAuthor = getRandomItem(mockAuthors);
  const media = getRandomMedia(i);
  const counts = getRandomCounts();
  const authorId = `user${i}`;

  let content = getRandomItem(textContent);
  let authorData = {
    name: randomAuthor.name,
    handle: randomAuthor.handle,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAuthor.avatarSeed}`,
  };

  // Special cases with galleries
  if (i === 1) {
    content =
      "This is my first post! Testing the FeedCard component with custom theme.";
    media.media_url = null;
    media.media_type = undefined;
    media.gallery = undefined;
    authorData = {
      name: "John Doe",
      handle: "@johndoe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    };
  } else if (i === 2) {
    content = "Check out this amazing image I found!";
    media.media_url =
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500";
    media.media_type = "image";
    media.gallery = undefined;
    authorData = {
      name: "Jane Smith",
      handle: "@janesmith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    };
  } else if (i === 3) {
    content = "Gallery test: 4 photos from my weekend adventure! 📸";
    media.media_url = null;
    media.gallery = [
      { url: imagePlaceholders[0], type: "image" },
      { url: imagePlaceholders[1], type: "image" },
      { url: imagePlaceholders[2], type: "image" },
      { url: imagePlaceholders[3], type: "image" },
    ];
    authorData = {
      name: "Alex Johnson",
      handle: "@alexj",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    };
  } else if (i === 4) {
    content = "Gallery demo: 2 images from my vacation! 🏖️";
    media.media_url = null;
    media.gallery = [
      { url: imagePlaceholders[4], type: "image" },
      { url: imagePlaceholders[5], type: "image" },
    ];
    authorData = {
      name: "Sarah Connor",
      handle: "@sarahc",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    };
  } else if (i === 5) {
    content = "Gallery with 3 beautiful photos! Check them out 🌟";
    media.media_url = null;
    media.gallery = [
      { url: imagePlaceholders[2], type: "image" },
      { url: imagePlaceholders[4], type: "image" },
      { url: imagePlaceholders[6], type: "image" },
    ];
    authorData = {
      name: "Michael Scott",
      handle: "@mscott",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    };
  } else if (i === 6) {
    content = "Photoset: 5 amazing moments captured! 📷";
    media.media_url = null;
    media.gallery = [
      { url: imagePlaceholders[0], type: "image" },
      { url: imagePlaceholders[2], type: "image" },
      { url: imagePlaceholders[4], type: "image" },
      { url: imagePlaceholders[1], type: "image" },
      { url: imagePlaceholders[5], type: "image" },
    ];
    authorData = {
      name: "Dwight Schrute",
      handle: "@dwights",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dwight",
    };
  } else if (i === 7) {
    content = "Mixed media: Photos and videos combined! 🎬📸";
    media.media_url = null;
    media.gallery = [
      { url: imagePlaceholders[0], type: "image" },
      { url: youtubePlaceholders[0], type: "youtube" },
      { url: imagePlaceholders[3], type: "image" },
      { url: imagePlaceholders[5], type: "image" },
    ];
    authorData = {
      name: "Pam Beesly",
      handle: "@pamb",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pam",
    };
  }

  mockPosts.push({
    id: i.toString(),
    content: content,
    created_at: getRandomDate(i),
    author_id: authorId,
    media_url: media.media_url,
    media_type: media.media_type,
    gallery: media.gallery,
    actions_count: counts.actions_count,
    replies_count: counts.replies_count,
    bookmark_count: counts.bookmark_count,
    shares_count: counts.shares_count,
    author: authorData,
  });
}

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

  // Lấy data từ API
  const { data: postsData, isLoading, isError } = usePosts();

  // Load more posts function
  const loadMorePosts = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setDisplayedCount((prev) => {
        const newCount = prev + 10;
        const allPosts = Array.isArray(postsData) ? postsData : [];
        if (newCount >= allPosts.length) {
          setHasMore(false);
        }
        return newCount;
      });
      setIsLoadingMore(false);
    }, 300);
  }, [postsData, isLoadingMore, hasMore]);

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
      is_liked: apiPost.is_liked || false,
      is_bookmarked: apiPost.is_saved || false,
      is_shared: apiPost.is_shared || false,
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
            {isLoading && displayedPosts.length === 0 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
              </div>
            )}

            {isError && (
              <div className="text-center py-8 text-red-500">
                Failed to load posts. Please try again later.
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
                    is_liked: item.is_liked,
                    is_bookmarked: item.is_bookmarked,
                    is_shared: item.is_shared,
                  }}
                  author={item.author}
                  onReply={handleReply}
                />
              ))}

            {!isLoading && !isError && displayedPosts.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                No posts yet. Be the first to post!
              </div>
            )}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {isLoadingMore && (
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
