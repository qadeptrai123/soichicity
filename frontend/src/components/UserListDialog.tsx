
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserListItem } from "@/components/UserListItem";
import { useFollowers, useFollowing } from "@/hooks/api/use-users";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import React from "react";

interface UserListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: "followers" | "following";
    username: string;
}

export function UserListDialog({ isOpen, onClose, userId, type, username }: UserListDialogProps) {
    const isFollowers = type === "followers";
    
    const { 
        data: followersData, 
        isLoading: isLoadingFollowers, 
        fetchNextPage: fetchNextFollowers, 
        hasNextPage: hasNextFollowers,
        isFetchingNextPage: isFetchingNextFollowers
    } = useFollowers(userId, { 
        enabled: isOpen && isFollowers 
    });
    
    const { 
        data: followingData, 
        isLoading: isLoadingFollowing, 
        fetchNextPage: fetchNextFollowing, 
        hasNextPage: hasNextFollowing,
        isFetchingNextPage: isFetchingNextFollowing
    } = useFollowing(userId, { 
        enabled: isOpen && !isFollowers 
    });

    const data = isFollowers ? followersData : followingData;
    const isLoading = isFollowers ? isLoadingFollowers : isLoadingFollowing;
    const fetchNextPage = isFollowers ? fetchNextFollowers : fetchNextFollowing;
    const hasNextPage = isFollowers ? hasNextFollowers : hasNextFollowing;
    const isFetchingNextPage = isFollowers ? isFetchingNextFollowers : isFetchingNextFollowing;

    const users = data?.pages.flatMap((page: any) => page.items) || [];
    const title = isFollowers ? "Followers" : "Following";

    // Infinite scroll observer
    const observerRef = React.useRef<IntersectionObserver | null>(null);
    const loadMoreRef = React.useCallback((node: HTMLDivElement | null) => {
        if (isLoading || isFetchingNextPage) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });

        if (node) observerRef.current.observe(node);
    }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 bg-secondary border-border text-white">
                <DialogHeader className="p-4 border-b border-border">
                    <DialogTitle className="text-xl font-bold text-left">{title}</DialogTitle>
                </DialogHeader>
                
                <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <LoadingSpinner />
                        </div>
                    ) : users.length > 0 ? (
                        <div>
                            {users.map((user: any) => (
                                <UserListItem key={user.uid} user={user} />
                            ))}
                            
                            {/* Load more trigger */}
                            <div ref={loadMoreRef} className="h-4 w-full flex justify-center items-center mt-2">
                                {isFetchingNextPage && <LoadingSpinner />}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <p>No {type} yet</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
