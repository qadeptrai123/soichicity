import { useState, useRef, useCallback, useEffect } from "react";
import ActivityItem from "@/components/ActivityItem";
import ActivityStats from "@/components/ActivityStats";
import AnimateEntrance from "@/components/ui/AnimateEntrance";
import { useAuth } from "@/contexts/AuthProvider";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useActivities, useMarkNotificationsRead } from "@/hooks/api/use-activities";

const TABS = ["All", "Likes", "Replies", "Mentions", "Reposts", "Follows", "Stats"];

const TAB_TO_FILTER_MAP: Record<string, string> = {
    "All": "all",
    "Likes": "like",
    "Replies": "reply",
    "Mentions": "mention",
    "Reposts": "repost",
    "Follows": "follow",
    "Stats": "stats"
};

export default function Activity() {
    const [activeTab, setActiveTab] = useState("All");
    const { isAuthenticated } = useAuth();

    // Map activeTab to API filter value
    const filter = TAB_TO_FILTER_MAP[activeTab] || "all";
    const isStatsTab = activeTab === "Stats";

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage
    } = useActivities(isStatsTab ? "all" : filter);

    const markReadMutation = useMarkNotificationsRead();

    // Mark as read when entering the page
    useEffect(() => {
        markReadMutation.mutate();
    }, []); // Run once on mount

    // Observer for infinite scroll
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    // Attach observer
    const observerRef = useCallback((node: HTMLDivElement | null) => {
        if (!node) return;
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
        observer.observe(node);
    }, [handleObserver]);


    if (!isAuthenticated) {
        return <div className="p-8 text-center text-gray-500">Please log in to view activity.</div>;
    }

    const activities = data?.pages.flatMap((page: any) => page?.items || []) || [];

    return (
        <div className="w-full max-w-2xl mx-auto pb-20 mt-4">

            {/* Activity List Card Container */}
            <AnimateEntrance>
                <div className="bg-secondary border border-border-secondary rounded-3xl overflow-hidden shadow-xl min-h-[500px]">

                    {/* Filter Tabs (Sticky Header) */}
                    <div className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-sm border-b border-[#374151] py-3">
                        <div className="flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar">
                            {TABS.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${activeTab === tab
                                        ? 'bg-white text-black'
                                        : 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {isStatsTab ? (
                            <ActivityStats />
                        ) : (
                            <>
                                {isLoading ? (
                                    <div className="py-10 flex justify-center"><LoadingSpinner /></div>
                                ) : activities.length > 0 ? (
                                    activities.map((activity: any, index: number) => (
                                        <ActivityItem
                                            key={activity.id}
                                            item={activity}
                                            isLast={index === activities.length - 1}
                                        />
                                    ))
                                ) : (
                                    <div className="py-20 text-center text-neutral-500">
                                        No notifications yet.
                                    </div>
                                )}

                                {/* Loading trigger */}
                                {hasNextPage && (
                                    <div ref={observerRef} className="py-4 flex justify-center">
                                        {isFetchingNextPage && <LoadingSpinner />}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </AnimateEntrance>
        </div>
    );
}
