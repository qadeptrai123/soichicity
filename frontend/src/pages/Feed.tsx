// Trang này sẽ là trang home luôn
import FeedCard from '@/components/FeedCard';
import { LoginPrompt } from '@/components/LoginPrompt';
import type { PostData, AuthorData, MediaItem } from '@/components/FeedCard';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { usePosts } from '@/hooks/api/use-posts';

const Feed = () => {
    const [displayedPosts, setDisplayedPosts] = useState<(PostData & { author: AuthorData })[]>([]);
    const [postsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoginPromptDismissed, setIsLoginPromptDismissed] = useState(false);
    const { isAuthenticated } = useAuth();
    const observerTarget = useRef<HTMLDivElement>(null);
    const postsRef = useRef<any[]>([]);

    const { data: postsData, isLoading: isPostsLoading, error: postsError } = usePosts();

    // Transform API data to add author object
    const transformedPosts = Array.isArray(postsData) ? postsData.map((post: any) => ({
        ...post,
        media_url: post.link_url?.[0] || null,
        media_type: post.link_url?.[0] ? 'image' : null,
        gallery: post.link_url && post.link_url.length > 1 ? post.link_url.map((url: string) => ({
            url,
            type: 'image' as const
        })) : undefined,
        actions_count: post.likeCount || 0,
        replies_count: post.commentCount || 0,
        bookmark_count: post.saveCount || 0,
        shares_count: post.shareCount || 0,
        author: {
            id: post.author_id,
            name: 'User',
            handle: '@user',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + post.author_id
        }
    })) : [];

    // Update ref when data changes
    useEffect(() => {
        postsRef.current = transformedPosts;
    }, [transformedPosts]);

    // Debug API Response
    useEffect(() => {
        console.log('=== TRANSFORMED DATA ===');
        console.log('transformedPosts:', transformedPosts);
        console.log('========================');
    }, [transformedPosts]);

    // Load more posts
    const loadMorePosts = useCallback(() => {
        if (isLoading || !hasMore || !postsRef.current.length) return;

        setIsLoading(true);
        setTimeout(() => {
            const startIndex = currentPage * postsPerPage;
            const endIndex = startIndex + postsPerPage;
            const newPosts = postsRef.current.slice(startIndex, endIndex);

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
        if (!isPostsLoading && postsRef.current.length > 0 && displayedPosts.length === 0) {
            loadMorePosts();
        }
    }, [isPostsLoading, displayedPosts.length, loadMorePosts]);

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

                        {displayedPosts.length > 0 && displayedPosts.map((item, index) => (
                            <FeedCard
                                key={`post-${item.id}-${index}`}
                                post={item}
                                author={item.author}
                            />
                        ))}

                        {/* Infinite scroll trigger */}
                        <div ref={observerTarget} className="py-8 text-center">
                            {(isLoading || isPostsLoading) && (
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
        </div>
    );
};

export default Feed;