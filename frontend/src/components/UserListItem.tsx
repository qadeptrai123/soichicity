import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollowUser, useUnfollowUser } from "@/hooks/api/use-users";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

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
}

export const UserListItem = ({ user }: UserListItemProps) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const followMutation = useFollowUser();
    const unfollowMutation = useUnfollowUser();

    const handleClick = () => {
        navigate(`/profile/${user.username}`);
    };

    const handleFollowToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) return; // Add login prompt dispatch if needed

        if (user.is_following) {
            unfollowMutation.mutate(user.uid);
        } else {
            followMutation.mutate(user.uid);
        }
    };

    const isLoading = followMutation.isPending || unfollowMutation.isPending;

    return (
        <div
            onClick={handleClick}
            className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-[#1F2937]"
        >
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-[#374151]">
                    <AvatarImage src={user.avatar_url || DEFAULT_AVATAR_URL} />
                    <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                    <span className="text-white font-bold leading-none">
                        {user.full_name || user.username}
                    </span>
                    <span className="text-[#6B7280] text-sm">
                        @{user.username}
                    </span>
                    {user.bio && (
                        <p className="text-[#9CA3AF] text-sm line-clamp-1 mt-1">
                            {user.bio}
                        </p>
                    )}
                </div>
            </div>

            {!user.is_self && (
                <Button
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    variant={user.is_following ? "outline" : "default"}
                    className={`h-8 rounded-full w-24 text-sm font-semibold transition-all ${user.is_following
                        ? "bg-transparent border-[#374151] text-white hover:border-white hover:text-white hover:bg-[#374151]"
                        : "bg-white text-black hover:bg-white/90 border-none"
                        }`}
                >
                    {user.is_following ? "Following" : "Follow"}
                </Button>
            )}
        </div>
    );
};
