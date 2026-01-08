import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import FeedCard from "@/components/FeedCard";
import { UserListItem } from "@/components/UserListItem";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

// Type definitions for Search Response
interface SearchResponse {
    users?: {
        hits: any[];
        total: number;
    };
    posts?: {
        hits: any[];
        total: number;
    };
    // When type specific
    hits?: any[];
    total?: number;
    type?: string;
}

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<"top" | "people" | "posts">("top");

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

    // Fetch Search Results
    const { data, isLoading, isError } = useQuery({
        queryKey: ["search", query, activeTab],
        queryFn: async () => {
            if (!query.trim()) return null;

            let type = "all";
            if (activeTab === "people") type = "user";
            if (activeTab === "posts") type = "post";

            try {
                const res: any = await api.search({ q: query, type });
                // apiClient interceptor returns data directly
                return res;
            } catch (error) {
                console.error("Search API Error:", error);
                throw error;
            }
        },
        enabled: !!query.trim(),
        staleTime: 1000 * 60, // 1 minute
    });

    // Helpers to extract data
    const getUsers = () => {
        if (!data) return [];
        if (activeTab === "top" && data.users) return data.users.hits;
        if (activeTab === "people" && data.hits) return data.hits;
        return [];
    };

    const getPosts = () => {
        if (!data) return [];
        if (activeTab === "top" && data.posts) return data.posts.hits;
        if (activeTab === "posts" && data.hits) return data.hits;
        return [];
    };

    return (
        <div className="w-full max-w-[600px] mx-auto min-h-screen text-white pb-20">
            {/* Sticky Search Header */}
            <div className="sticky top-0 z-20 bg-backgroundfeed/95 backdrop-blur-md pt-4 pb-2 px-4 border-b border-[#1F2937]">
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
                ) : isLoading ? (
                    <div className="py-20 flex justify-center">
                        <LoadingSpinner />
                    </div>
                ) : isError ? (
                    <div className="text-center py-20 text-red-400">
                        Something went wrong. Please try again.
                    </div>
                ) : (
                    <div>
                        {/* USERS SECTION (Only for Top or People tabs) */}
                        {(activeTab === "top" || activeTab === "people") && getUsers().length > 0 && (
                            <div className="mb-2">
                                {activeTab === "top" && (
                                    <h3 className="px-4 py-3 font-bold text-xl border-b border-[#1F2937]">People</h3>
                                )}
                                <div className="flex flex-col">
                                    {getUsers().slice(0, activeTab === "top" ? 3 : undefined).map((hit: any) => (
                                        <UserListItem
                                            key={hit.objectID}
                                            user={{
                                                uid: hit.objectID,
                                                username: hit.username,
                                                full_name: hit.full_name,
                                                avatar_url: hit.avatar_url,
                                                bio: hit.bio,
                                                // Note: is_following might not come from Algolia initially unless indexed. 
                                                // If critical, we need to fetch status or assume false/fetch on component mount.
                                                // For now assuming the data structure matches enough or has defaults.
                                            }}
                                        />
                                    ))}
                                </div>
                                {activeTab === "top" && getUsers().length > 3 && (
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
                        {(activeTab === "top" || activeTab === "posts") && getPosts().length > 0 && (
                            <div>
                                {activeTab === "top" && (
                                    <h3 className="px-4 py-3 font-bold text-xl border-t border-b border-[#1F2937] mt-2 bg-backgroundfeed/50">Posts</h3>
                                )}
                                {getPosts().map((hit: any) => (
                                    <FeedCard
                                        key={hit.objectID}
                                        post={{
                                            post_id: hit.objectID,
                                            content: hit.content,
                                            created_at: new Date(hit.created_at || (hit.created_at_i * 1000)).toISOString(), // Adjust based on timestamp format
                                            author_id: hit.author_id,
                                            author: {
                                                uid: hit.author?.uid || hit.author_id || hit.objectID,
                                                username: hit.author?.username || hit.username || "user",
                                                full_name: hit.author?.full_name || hit.full_name || "Unknown User",
                                                avatar_url: hit.author?.avatar_url || hit.avatar_url || DEFAULT_AVATAR_URL,
                                                // Fallback
                                                name: hit.author?.full_name || hit.full_name || "Unknown User",
                                                handle: hit.author?.username || hit.username ? `@${hit.author?.username || hit.username}` : "@user",
                                                avatar: hit.author?.avatar_url || hit.avatar_url || DEFAULT_AVATAR_URL
                                            },
                                            media_urls: hit.media_urls || [hit.media_url].filter(Boolean) || [],
                                            media_url: hit.media_url || hit.media_urls?.[0] || null,
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
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty States */}
                        {getUsers().length === 0 && getPosts().length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                No results found for "{query}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
