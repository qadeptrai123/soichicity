import type { ActivityItem as ActivityItemType } from "@/types/activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, UserPlus, AtSign } from "lucide-react";

interface ActivityItemProps {
    item: ActivityItemType;
    isLast?: boolean;
}

export default function ActivityItem({ item, isLast }: ActivityItemProps) {

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


    return (
        <div className={`flex gap-3 py-4 px-4 hover:bg-white/5 transition-colors ${!isLast ? 'border-b border-[#374151]' : ''}`}>

            {/* Avatar Section with Badge */}
            <div className="relative w-10 h-10 flex-none">
                <Avatar className={`w-full h-full border ${BORDER_COLOR}`}>
                    <AvatarImage src={item.user.avatar_url} alt={item.user.username} />
                    <AvatarFallback>{item.user.username[0].toUpperCase()}</AvatarFallback>
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
                    <span className="text-neutral-500 text-xs">{item.created_at}</span>
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
                    <button className="px-5 py-1.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors">
                        Follow
                    </button>
                </div>
            )}
        </div>
    );
}
