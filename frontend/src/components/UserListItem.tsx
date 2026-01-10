import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollowUser, useUnfollowUser } from "@/hooks/api/use-users";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useState } from "react";
import { LoginPrompt } from "@/components/LoginPrompt";
import { UnfollowDialog } from "@/components/UnfollowDialog";

interface UserListItemProps {
    user: {
        uid: string;
        username: string;
        full_name?: string;
        avatar_url?: string;
        is_following?: boolean;
        is_self?: boolean;
        bio?: string;
    };
    onClose?: () => void;
}

export const UserListItem = ({ user, onClose }: UserListItemProps) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
    
    const followMutation = useFollowUser();
    const unfollowMutation = useUnfollowUser();

    const handleClick = () => {
        if (onClose) onClose();
        navigate(`/profile/${user.username}`);
    };

    const handleFollowToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }

        if (user.is_following) {
            setShowUnfollowDialog(true);
        } else {
            followMutation.mutate(user.uid);
        }
    };

    const handleConfirmUnfollow = () => {
        unfollowMutation.mutate(user.uid);
        setShowUnfollowDialog(false);
    };

    const isLoading = followMutation.isPending || unfollowMutation.isPending;

    return (
        <>
            <div
                onClick={handleClick}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || DEFAULT_AVATAR_URL} loading="eager" />
                        <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0">
                        <span className="text-white font-bold leading-none truncate">
                            {user.full_name || user.username}
                        </span>
                        <span className="text-gray-400 text-sm truncate">
                            @{user.username}
                        </span>

                    </div>
                </div>

                {!user.is_self && (
                    <Button
                        onClick={handleFollowToggle}
                        disabled={isLoading}
                        variant={user.is_following ? "outline" : "default"}
                        className={`h-8 rounded-full w-24 text-sm font-semibold transition-all ${user.is_following
                            ? "bg-transparent border-neutral-600 text-white hover:border-red-500 hover:text-red-500 hover:bg-transparent"
                            : "bg-primary text-white hover:bg-primary-hover border-none"
                            }`}
                    >
                        {user.is_following ? "Following" : "Follow"}
                    </Button>
                )}
            </div>

            <UnfollowDialog 
                isOpen={showUnfollowDialog}
                onClose={() => setShowUnfollowDialog(false)}
                onConfirm={handleConfirmUnfollow}
                username={user.username}
                avatarUrl={user.avatar_url}
                isPending={unfollowMutation.isPending}
            />

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
                        <LoginPrompt />
                    </div>
                </div>
            )}
        </>
    );
};
