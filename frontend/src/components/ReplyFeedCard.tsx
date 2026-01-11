import React from "react";
import FeedCard from "./FeedCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import type { Post as PostData, Author as AuthorData } from "@/types/post";

interface ReplyFeedCardProps {
    post: PostData;
    onReply?: (post: PostData, author: AuthorData) => void;
    onEdit?: (post: PostData) => void;
}

const ReplyFeedCard: React.FC<ReplyFeedCardProps> = ({ post, onReply, onEdit }) => {
    const navigate = useNavigate();
    const parentPost = post.reply_to_post;

    // If no parent post data (legacy or error), just render the FeedCard
    if (!parentPost) {
        return (
            <FeedCard
                post={post}
                author={post.author!}
                onReply={onReply}
                onEdit={onEdit}
            />
        );
    }

    const handleParentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/post/${parentPost.post_id}`);
    };

    const handleParentAuthorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (parentPost.author?.username) {
            navigate(`/profile/${parentPost.author.username}`);
        }
    };

    return (
        <div className="flex flex-col border-b border-border/50">
            {/* Parent Post Context */}
            <div className="flex gap-3 px-4 pt-4 pb-0 cursor-pointer" onClick={handleParentClick}>
                <div className="flex flex-col items-center">
                    <Avatar
                        className="w-10 h-10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleParentAuthorClick}
                    >
                        <AvatarImage src={parentPost.author?.avatar_url || DEFAULT_AVATAR_URL} />
                        <AvatarFallback>{parentPost.author?.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    {/* Connecting Line */}
                    <div className="w-0.5 flex-1 bg-border/60 my-2 rounded-full min-h-[20px]"></div>
                </div>

                <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="font-bold hover:underline cursor-pointer text-foreground text-sm"
                            onClick={handleParentAuthorClick}
                        >
                            {parentPost.author?.full_name || parentPost.author?.username || "Unknown"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                            {formatRelativeTime(parentPost.created_at)}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{parentPost.content}</p>
                </div>
            </div>

            {/* The Reply (FeedCard) */}
            {/* We use negative margin or custom styling to merge visually if needed, 
            but FeedCard has padding. Let's try to make it look seamless. */}
            <div className="-mt-2">
                <FeedCard
                    post={post}
                    author={post.author!}
                    onReply={onReply}
                    onEdit={onEdit}
                    hideBorder={true}
                    className="!shadow-none !bg-transparent border-0" // Override generic card styles to fit in list
                />
            </div>
        </div>
    );
};

export default ReplyFeedCard;
