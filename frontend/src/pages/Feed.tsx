// Trang này sẽ là trang home luôn
import FeedCard from '@/components/FeedCard';
import { LoginPrompt } from '@/components/LoginPrompt';
import type { PostData, AuthorData, MediaItem } from '@/components/FeedCard';
import { useEffect, useState, useRef, useCallback } from 'react';

// --- BẮT ĐẦU: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---

// Danh sách tác giả giả
const mockAuthors = [
    { name: 'John Doe', handle: '@johndoe', avatarSeed: 'John' },
    { name: 'Jane Smith', handle: '@janesmith', avatarSeed: 'Jane' },
    { name: 'Alex Johnson', handle: '@alexj', avatarSeed: 'Alex' },
    { name: 'Sarah Connor', handle: '@sarahc', avatarSeed: 'Sarah' },
    { name: 'Michael Scott', handle: '@mscott', avatarSeed: 'Michael' },
    { name: 'Dwight Schrute', handle: '@dwights', avatarSeed: 'Dwight' },
    { name: 'Pam Beesly', handle: '@pamb', avatarSeed: 'Pam' },
    { name: 'Jim Halpert', handle: '@jimh', avatarSeed: 'Jim' },
    { name: 'Leslie Knope', handle: '@lesliek', avatarSeed: 'Leslie' },
    { name: 'Ron Swanson', handle: '@rons', avatarSeed: 'Ron' },
];

// URLs video YouTube 
const youtubePlaceholders = [
    'https://www.youtube.com/watch?v=Oz8RF_1eGxw',
    'https://www.youtube.com/watch?v=eMW9ZxXxCHI',
    'https://www.youtube.com/watch?v=8STFDAO7UEQ',
    'https://www.youtube.com/watch?v=mnBAZ-VkuEg',
    'https://www.youtube.com/watch?v=3bJkVSMs4dw',
];

// URLs ảnh placeholder (giữ nguyên)
const imagePlaceholders = [
    'https://images.pexels.com/photos/1486974/pexels-photo-1486974.jpeg?cs=srgb&dl=pexels-james-wheeler-1486974.jpg&fm=jpg',
    'https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg?cs=srgb&dl=pexels-pixabay-414171.jpg&fm=jpg',
    'https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg?cs=srgb&dl=pexels-lukas-736230.jpg&fm=jpg',
    'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?cs=srgb&dl=pexels-andrea-piacquadio-1108099.jpg&fm=jpg',
    'https://images.pexels.com/photos/210647/pexels-photo-210647.jpeg?cs=srgb&dl=pexels-pixabay-210647.jpg&fm=jpg',
    'https://images.pexels.com/photos/34950/pexels-photo.jpg?cs=srgb&dl=pexels-pixabay-34950.jpg&fm=jpg',
];

// Nội dung bài đăng giả (giữ nguyên)
const textContent = [
    'Just finished an amazing project! Feeling super accomplished. What are you all working on?',
    'Loving the new features in the latest update. It really streamlines the workflow!',
    'A little behind-the-scenes look at my workspace today. Productivity is key! 💻',
    'Thoughts on the latest tech trends? Are we ready for the next big thing?',
    'Travel goals: Where should I go next? Drop your best recommendations below! 🌍',
    'Sometimes you just need a good cup of coffee to get through the day. ☕',
    'Experimenting with new recipes this weekend. Wish me luck! 🍲',
    'Found this incredible quote today: "The only way to do great work is to love what you do." - Steve Jobs',
    'Nature walk was exactly what I needed to clear my head. Highly recommend taking a break!',
    'Excited to announce my new product launch next week! Stay tuned for more details.',
    'Just watched a great documentary. Mind blown! 🤯',
    'Coding late tonight. The debugger is my best friend (and worst enemy).',
    'Throwback to a great vacation. Missing the sun and the beach! 🏖️',
    'Learning a new programming language. Any tips for a beginner?',
    'Happy Friday, everyone! What are your weekend plans?',
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMedia(id: number): { media_url: string | null; media_type?: 'image' | 'video'; gallery?: MediaItem[] } {
    const mediaTypeRoll = id % 6;
    if (mediaTypeRoll === 0) {
        return { media_url: null };
    } else if (mediaTypeRoll === 1) {
        return { media_url: getRandomItem(imagePlaceholders), media_type: 'image' };
    } else if (mediaTypeRoll === 2 || mediaTypeRoll === 4) {
        return { media_url: getRandomItem(youtubePlaceholders), media_type: 'video' };
    } else {
        // Gallery with multiple images
        const galleryCount = 2 + Math.floor(Math.random() * 3); // 2-4 images
        const gallery: MediaItem[] = [];
        for (let i = 0; i < galleryCount; i++) {
            gallery.push({
                url: getRandomItem(imagePlaceholders),
                type: 'image'
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
        shares_count: Math.floor(Math.random() * 50)
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
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAuthor.avatarSeed}`
    };

    // Special cases with galleries
    if (i === 1) {
        content = 'This is my first post! Testing the FeedCard component with custom theme.';
        media.media_url = null;
        media.media_type = undefined;
        media.gallery = undefined;
        authorData = { name: 'John Doe', handle: '@johndoe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' };
    } else if (i === 2) {
        content = 'Check out this amazing image I found!';
        media.media_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500';
        media.media_type = 'image';
        media.gallery = undefined;
        authorData = { name: 'Jane Smith', handle: '@janesmith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' };
    } else if (i === 3) {
        content = 'Gallery test: 4 photos from my weekend adventure! 📸';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[0], type: 'image' },
            { url: imagePlaceholders[1], type: 'image' },
            { url: imagePlaceholders[2], type: 'image' },
            { url: imagePlaceholders[3], type: 'image' }
        ];
        authorData = { name: 'Alex Johnson', handle: '@alexj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' };
    } else if (i === 4) {
        content = 'Gallery demo: 2 images from my vacation! 🏖️';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[4], type: 'image' },
            { url: imagePlaceholders[5], type: 'image' }
        ];
        authorData = { name: 'Sarah Connor', handle: '@sarahc', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' };
    } else if (i === 5) {
        content = 'Gallery with 3 beautiful photos! Check them out 🌟';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[2], type: 'image' },
            { url: imagePlaceholders[4], type: 'image' },
            { url: imagePlaceholders[6], type: 'image' }
        ];
        authorData = { name: 'Michael Scott', handle: '@mscott', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' };
    } else if (i === 6) {
        content = 'Photoset: 5 amazing moments captured! 📷';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[0], type: 'image' },
            { url: imagePlaceholders[2], type: 'image' },
            { url: imagePlaceholders[4], type: 'image' },
            { url: imagePlaceholders[1], type: 'image' },
            { url: imagePlaceholders[5], type: 'image' }
        ];
        authorData = { name: 'Dwight Schrute', handle: '@dwights', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dwight' };
    } else if (i === 7) {
        content = 'Mixed media: Photos and videos combined! 🎬📸';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[0], type: 'image' },
            { url: youtubePlaceholders[0], type: 'youtube' },
            { url: imagePlaceholders[3], type: 'image' },
            { url: imagePlaceholders[5], type: 'image' }
        ];
        authorData = { name: 'Pam Beesly', handle: '@pamb', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pam' };
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
        author: authorData
    });
}

// --- KẾT THÚC: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---

const Feed = () => {
    const [displayedPosts, setDisplayedPosts] = useState<(PostData & { author: AuthorData })[]>([]);
    const [postsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Check authentication on mount
    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        setIsAuthenticated(!!accessToken);
    }, []);

    // Load more posts
    const loadMorePosts = useCallback(() => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            const startIndex = currentPage * postsPerPage;
            const endIndex = startIndex + postsPerPage;
            const newPosts = mockPosts.slice(startIndex, endIndex);

            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                setDisplayedPosts(prev => [...prev, ...newPosts]);
                setCurrentPage(prev => prev + 1);
            }
            setIsLoading(false);
        }, 300);
    }, [currentPage, postsPerPage, isLoading, hasMore]);

    // Initial load
    useEffect(() => {
        loadMorePosts();
    }, []);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
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



    return (
        <div className="bg-backgroundfeed min-h-screen p-4">
            <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Empty left column for spacing */}
                <div className="hidden lg:block"></div>

                {/* Feed Posts - Center */}
                <div className="lg:col-span-2">
                    <div className="space-y-4">
                        {displayedPosts.length > 0 && displayedPosts.map((item) => (
                            <FeedCard
                                key={item.id}
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
                                    shares_count: item.shares_count
                                }}
                                author={item.author}
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

                {/* Login Prompt - Right Column */}
                {isAuthenticated ? null : (
                    <div className="lg:col-span-1 w-full">
                        <div className="sticky top-4">
                            <LoginPrompt />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feed;