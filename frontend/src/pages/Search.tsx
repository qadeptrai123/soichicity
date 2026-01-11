import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import FeedCard from "@/components/FeedCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import { UserListItem } from "@/components/UserListItem";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/services/api";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";



export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<"top" | "people" | "posts">("top");
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);


    // Sync state if URL changes externally (e.g. navigation from SearchDialog)
    useEffect(() => {
        if (initialQuery !== query) {
            setQuery(initialQuery);
        }
    }, [initialQuery]); // Only listen to URL changes

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        // Update URL immediately (or debounce if needed)
        if (val) {
            setSearchParams({ q: val });
        } else {
            setSearchParams({});
        }
    };

    // Sync state if URL changes externally (e.g. navigation from SearchDialog)
    useEffect(() => {
        if (initialQuery !== query) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    // Fetch Search Results with Infinite Scroll
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useInfiniteQuery({
        queryKey: ["search", query, activeTab],
        queryFn: async ({ pageParam = 0 }) => {
            if (!query.trim()) return null;

            let type = "all";
            if (activeTab === "people") type = "user";
            if (activeTab === "posts") type = "post";

            try {
                // Determine limit based on tab? User asked for 5.
                const limit = 5;
                const res: any = await api.search({ q: query, type, page: pageParam, limit });
                return res;
            } catch (error) {
                console.error("Search API Error:", error);
                throw error;
            }
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: any) => {
            if (!lastPage) return undefined;

            // Allow pagination if we have hits and current page < total pages
            // Need to handle different response structures for 'all' vs 'type'

            let currentPage = 0;
            let totalPages = 0;

            if (activeTab === "top") {
                // For "top" (all), we usually mainly paginated posts or users?
                // The backend 'search_all' returns { users: {...}, posts: {...} }
                // Pagination for mixed results is tricky. 
                // User said "random 5 items... scroll load more".
                // Usually applies to the specific lists.
                // For "Top", let's depend on Posts pagination provided it's the main content.
                currentPage = lastPage.posts?.page || 0;
                totalPages = lastPage.posts?.pages || 0;
            } else if (activeTab === "people") {
                currentPage = lastPage.page || 0;
                totalPages = lastPage.pages || 0;
            } else if (activeTab === "posts") {
                currentPage = lastPage.page || 0;
                totalPages = lastPage.pages || 0;
            }

            if (currentPage < totalPages - 1) {
                return currentPage + 1;
            }
            return undefined;
        },
        enabled: !!query.trim(),
        staleTime: 1000 * 60, // 1 minute
    });

    // Intersection Observer for Infinite Scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading || isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);


    // Helpers to extract flattened data
    const getUsers = () => {
        if (!data) return [];
        return data.pages.flatMap((page: any) => {
            if (!page) return [];
            if (activeTab === "top" && page.users) return page.users.hits;
            if (activeTab === "people" && page.hits) return page.hits;
            return [];
        });
    };

    const getPosts = () => {
        if (!data) return [];
        return data.pages.flatMap((page: any) => {
            if (!page) return [];
            if (activeTab === "top" && page.posts) return page.posts.hits;
            if (activeTab === "posts" && page.hits) return page.hits;
            return [];
        });
    };

    // Safety check for empty results across all pages
    const hasUsers = getUsers().length > 0;
    const hasPosts = getPosts().length > 0;
    const isEmpty = !isLoading && !hasUsers && !hasPosts && query.trim().length > 0;

    return (
        <div className="w-full max-w-[600px] mx-auto min-h-screen text-white pb-20">
            {/* Sticky Search Header */}
            <div className="sticky top-16 z-20 bg-backgroundfeed/95 backdrop-blur-md pt-4 pb-2 px-4 border-b border-[#1F2937]">
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                        <SearchIcon size={20} />
                    </div>
                    <Input
                        value={query}
                        onChange={handleSearchChange}
                        placeholder="Search Sợi Chỉ City"
                        className="pl-10 bg-input border-0 rounded-full h-11 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 text-base"
                    />
                </div>

                {/* Tabs */}
                <div className="flex w-full justify-between px-2">
                    {[
                        { id: "top", label: "Top" },
                        { id: "people", label: "People" },
                        { id: "posts", label: "Posts" },
                    ].map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`relative py-3 px-4 cursor-pointer font-medium text-[15px] transition-colors ${activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-blue-500 rounded-full mx-auto w-10" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="mt-2">
                {!query.trim() ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg">Try searching for people, posts, or keywords</p>
                    </div>
                ) : isLoading && !isFetchingNextPage ? ( // Only show full spinner on initial load
                    <div className="py-20 flex justify-center">
                        <LoadingSpinner />
                    </div>
                ) : isError ? (
                    <div className="text-center py-20 text-red-400">
                        Something went wrong. Please try again.
                    </div>
                ) : (
                    <div>
                        {/* USERS SECTION */}
                        {(activeTab === "top" || activeTab === "people") && hasUsers && (
                            <div className="mb-2">
                                {activeTab === "top" && (
                                    <h3 className="px-4 py-3 font-bold text-xl border-b border-[#1F2937]">People</h3>
                                )}
                                <div className="flex flex-col">
                                    {getUsers().map((hit: any, index) => {
                                        // Use ref on the last element of the list if this is the active tab for scrolling
                                        const isLast = index === getUsers().length - 1;
                                        const ref = (activeTab === "people" && isLast) ? lastElementRef : null;

                                        return (
                                            <div key={`${hit.objectID}-${index}`} ref={ref}>
                                                <UserListItem
                                                    user={{
                                                        uid: hit.objectID,
                                                        username: hit.username,
                                                        full_name: hit.full_name,
                                                        avatar_url: hit.avatar_url,
                                                        bio: hit.bio,
                                                        is_following: hit.is_following,
                                                        is_self: hit.is_self,
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                {activeTab === "top" && getUsers().length > 0 && (
                                    <div
                                        onClick={() => setActiveTab("people")}
                                        className="p-4 text-blue-400 hover:bg-white/5 cursor-pointer text-sm"
                                    >
                                        Show more people
                                    </div>
                                )}
                            </div>
                        )}

                        {/* POSTS SECTION */}
                        {(activeTab === "top" || activeTab === "posts") && hasPosts && (
                            <div>
                                {activeTab === "top" && (
                                    <h3 className="px-4 py-3 font-bold text-xl border-t border-b border-[#1F2937] mt-2 bg-backgroundfeed/50">Posts</h3>
                                )}
                                {getPosts().map((hit: any, index) => {
                                    // Use ref on the last element of the list if this is the active tab for scrolling
                                    const isLast = index === getPosts().length - 1;
                                    const ref = ((activeTab === "posts" || activeTab === "top") && isLast) ? lastElementRef : null;

                                    // Logic to match Feed.tsx for media display
                                    const mediaList = hit.media_urls || (hit.media_url ? [hit.media_url] : []) || [];
                                    let gallery: string[] | undefined;
                                    let singleMediaUrl: string | null = null;
                                    let singleMediaType: string | null = null;

                                    if (mediaList.length > 1) {
                                        gallery = mediaList;
                                    } else if (mediaList.length === 1) {
                                        singleMediaUrl = mediaList[0];
                                        const url = singleMediaUrl!;
                                        const isYoutube = /(?:youtube\.com|youtu\.be)/.test(url);
                                        const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                                        singleMediaType = isYoutube ? "youtube" : isVideo ? "video" : "image";
                                    }

                                    return (
                                        <div key={`${hit.objectID}-${index}`} ref={ref}>
                                            <FeedCard
                                                post={{
                                                    post_id: hit.objectID,
                                                    content: hit.content,
                                                    created_at: new Date(hit.created_at || (hit.created_at_i * 1000)).toISOString(),
                                                    author_id: hit.author_id,
                                                    author: {
                                                        uid: hit.author?.uid || hit.author_id || hit.objectID,
                                                        username: hit.author?.username || hit.username || "user",
                                                        full_name: hit.author?.full_name || hit.full_name || "Unknown User",
                                                        avatar_url: hit.author?.avatar_url || hit.avatar_url || DEFAULT_AVATAR_URL,
                                                        name: hit.author?.full_name || hit.full_name || "Unknown User",
                                                        handle: hit.author?.username || hit.username ? `@${hit.author?.username || hit.username}` : "@user",
                                                        avatar: hit.author?.avatar_url || hit.avatar_url || DEFAULT_AVATAR_URL
                                                    },
                                                    media_urls: mediaList,
                                                    media_url: singleMediaUrl,
                                                    media_type: singleMediaType as any,
                                                    gallery: gallery,
                                                    likes_count: hit.likes_count || hit.likes || 0,
                                                    comments_count: hit.comments_count || hit.replies_count || 0,
                                                    reposts_count: hit.reposts_count || 0,
                                                    saves_count: hit.saves_count || 0,
                                                }}
                                                author={{
                                                    uid: hit.author?.uid || hit.author_id || hit.objectID,
                                                    username: hit.author?.username || hit.username || "user",
                                                    full_name: hit.author?.full_name || hit.full_name || "Unknown User",
                                                    avatar_url: hit.author?.avatar_url || hit.avatar_url || DEFAULT_AVATAR_URL,
                                                    name: hit.author?.full_name || hit.full_name || "Unknown User",
                                                    handle: hit.author?.username || hit.username ? `@${hit.author?.username || hit.username}` : "@user",
                                                    avatar: hit.author?.avatar_url || hit.avatar_url || DEFAULT_AVATAR_URL,
                                                    id: hit.author?.uid || hit.author_id || hit.objectID
                                                }}
                                                onAuthRequired={() => setShowLoginPrompt(true)}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Loading More Spinner */}
                        {isFetchingNextPage && (
                            <div className="py-4 flex justify-center">
                                <LoadingSpinner />
                            </div>
                        )}

                        {/* Empty States */}
                        {isEmpty && (
                            <div className="text-center py-20 text-gray-500">
                                No results found for "{query}"
                            </div>
                        )}
                    </div>
                )}
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
                        <LoginPrompt onClose={() => setShowLoginPrompt(false)} />
                    </div>
                </div>
            )}
            {/* Login Prompt Overlay */}
            <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-sm" showCloseButton={false}>
                    <DialogTitle className="sr-only">Login Required</DialogTitle>
                    <LoginPrompt onClose={() => setShowLoginPrompt(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
