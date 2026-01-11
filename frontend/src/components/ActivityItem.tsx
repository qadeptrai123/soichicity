import { useState, useEffect } from "react";
import type { ActivityItem as ActivityItemType } from "@/types/activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, UserPlus, AtSign } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { useFollowUser, useUnfollowUser } from "@/hooks/api/use-users";
import { UnfollowDialog } from "./UnfollowDialog";

interface ActivityItemProps {
    item: any; // Allow any for flexibility with backend response

    isLast?: boolean;
}

export default function ActivityItem({ item, isLast }: ActivityItemProps) {
    const navigate = useNavigate();
    const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
    const [isFollowing, setIsFollowing] = useState(!!item.user.is_following);

    useEffect(() => {
        setIsFollowing(!!item.user.is_following);
    }, [item.user.is_following]);

    const followMutation = useFollowUser();
    const unfollowMutation = useUnfollowUser();

    // Helper to determine badge properties
    const getBadgeProps = () => {
        switch (item.type) {
            case 'like':
                return { bg: 'bg-rose-500', icon: <Heart size={10} fill="currentColor" className="text-white" /> };
            case 'reply':
                return { bg: 'bg-blue-500', icon: <MessageCircle size={10} fill="currentColor" className="text-white" /> };
            case 'mention':
                return { bg: 'bg-green-500', icon: <AtSign size={10} className="text-white" /> };
            case 'follow':
                return { bg: 'bg-purple-600', icon: <UserPlus size={10} className="text-white" /> };
            case 'repost':
                return { bg: 'bg-green-500', icon: <Repeat2 size={10} className="text-white" /> };
            default:
                return null;
        }
    };

    const badgeProps = getBadgeProps();
    const BORDER_COLOR = "border-[#374151]";

    const handleClick = () => {
        if (item.type === 'follow') return;

        if (item.post_id) {
            navigate(`/post/${item.post_id}`);
        }
    };

    const handleAvatarClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering row click
        navigate(`/profile/${item.user.username}`);
    };

    const handleFollowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFollowing) {
            setShowUnfollowDialog(true);
        } else {
            setIsFollowing(true);
            followMutation.mutate(item.user.uid, {
                onError: () => setIsFollowing(false)
            });
        }
    };

    return (
        <>
            <div
                onClick={handleClick}
                className={`flex gap-3 py-4 px-4 hover:bg-white/5 transition-colors ${!isLast ? 'border-b border-[#374151]' : ''} ${item.type !== 'follow' ? 'cursor-pointer' : ''}`}
            >

                {/* Avatar Section with Badge */}
                <div className="relative w-10 h-10 flex-none cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className={`w-full h-full border ${BORDER_COLOR}`}>
                        <AvatarImage src={item.user.avatar_url || DEFAULT_AVATAR_URL} alt={item.user.username} className="object-cover" />
                        <AvatarFallback>{item.user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>

                    {/* Badge Icon (Matching ActivityPopup style) */}
                    {badgeProps && (
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${badgeProps.bg} ring-2 ring-secondary flex items-center justify-center`}>
                            {badgeProps.icon}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-1">

                    {/* Header: Username + Timestamp */}
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{item.user.username}</span>
                        <span className="text-neutral-500 text-xs">{formatRelativeTime(item.created_at)}</span>
                    </div>

                    {/* Context Text */}
                    {item.context_text && (
                        <p className="text-neutral-400 text-sm">{item.context_text}</p>
                    )}

                    {/* Main Content */}
                    {item.content && (
                        <p className="text-gray-300 text-[15px] leading-snug whitespace-pre-wrap">{item.content}</p>
                    )}

                </div>
                {/* Follow Button logic */}
                {item.type === 'follow' && (
                    <div className="self-center">
                        <button
                            onClick={handleFollowClick}
                            disabled={followMutation.isPending || unfollowMutation.isPending}
                            className={`px-5 py-1.5 text-sm font-bold rounded-xl transition-all duration-200 active:scale-95 ${isFollowing
                                    ? "bg-transparent border border-neutral-600 text-white hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
                                    : "bg-white text-black hover:bg-gray-200"
                                }`}
                        >
                            {isFollowing ? "Following" : "Follow"}
                        </button>
                    </div>
                )}
            </div>

            <UnfollowDialog
                isOpen={showUnfollowDialog}
                onClose={() => setShowUnfollowDialog(false)}
                onConfirm={() => {
                    setIsFollowing(false);
                    unfollowMutation.mutate(item.user.uid, {
                        onError: () => setIsFollowing(true),
                        onSettled: () => setShowUnfollowDialog(false)
                    });
                }}
                username={item.user.username}
                avatarUrl={item.user.avatar_url}
                isPending={unfollowMutation.isPending}
            />
        </>
    );
}
