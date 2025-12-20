import React from "react";
import { Button } from "@/components/ui/button";

interface ActionButtonProps {
    actionId?: "like" | "reply" | "repost" | "share" | "bookmark" | string;
    icon: React.ReactNode;
    count?: number;
    onClick?: (e?: React.MouseEvent) => void;
    isActive?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    actionId,
    icon,
    count,
    onClick,
    isActive,
}) => {
    let activeButtonClasses = "";
    let iconExtraClasses = "";

    // Base hover classes matching PostMainPost where applicable, 
    // or FeedCard's simplified logic but with PostMainPost's specific colors.
    // PostMainPost colors:
    // Like: hover:text-rose-500
    // Reply: hover:text-blue-500
    // Repost: hover:text-green-500
    // Share: hover:text-blue-400
    // Bookmark: (Not in PostMainPost snippet, but usually yellow/blue?) -> FeedCard used yellow.

    // Logic: 
    // If active -> Specific color + fill. 
    // If inactive -> Text secondary, hover -> Specific color.

    switch (actionId) {
        case "like":
            if (isActive) {
                activeButtonClasses = "text-rose-600 hover:text-rose-700";
                iconExtraClasses = "fill-current";
            } else {
                activeButtonClasses = "text-[#94a3b8] hover:text-rose-500";
            }
            break;
        case "reply":
            activeButtonClasses = "text-[#94a3b8] hover:text-blue-500";
            // Replies usually don't have an "active" state like liked/saved, but if they did:
            if (isActive) activeButtonClasses = "text-blue-500 hover:text-blue-600";
            break;
        case "repost":
            if (isActive) {
                activeButtonClasses = "text-blue-500 hover:text-blue-500"; // Green for repost
                // iconExtraClasses = "fill-current"; // Repost icon (Repeat2) might not fill nicely depending on icon
            } else {
                activeButtonClasses = "text-[#94a3b8] hover:text-blue-600";
            }
            break;
        case "share":
            activeButtonClasses = "text-[#94a3b8] hover:text-blue-500";
            break;
        case "bookmark":
            if (isActive) {
                activeButtonClasses = "text-yellow-500 hover:text-blue-500";
                iconExtraClasses = "fill-current";
            } else {
                activeButtonClasses = "text-[#94a3b8] hover:text-blue-600"; // Or hover:text-foreground
            }
            break;
        default:
            // Fallback
            if (isActive) {
                activeButtonClasses = "text-foreground";
                iconExtraClasses = "fill-current";
            } else {
                activeButtonClasses = "text-[#94a3b8] hover:text-foreground";
            }
    }

    const renderedIcon = React.isValidElement(icon)
        ? React.cloneElement(icon as any, {
            className: `${(icon as any).props.className || ""} ${iconExtraClasses}`.trim(),
        })
        : icon;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={`action-button-base w-8 h-8 flex items-center gap-1 transition-colors group/icon hover:bg-transparent ${activeButtonClasses}`}
        >
            {renderedIcon}
            {count !== undefined && count !== null && (
                <span className={`text-xs font-medium text-[#94a3b8]`}>
                    {/* Count color: PostMainPost keeps it styled with the icon on hover. 
                FeedCard used 'small-text'. 
                We use 'font-medium' and inherit color from button.
             */}
                    {count > 0 ? count : ""}
                </span>
            )}
        </Button>
    );
};
