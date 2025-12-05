import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bookmark, Repeat2, Heart, Send, X, Play, Edit3, Ban, Link2 } from "lucide-react";
import { DropdownExtend } from './DropdownExtend';
// 1. Định nghĩa kiểu dữ liệu cho Post (khớp với Firestore)
export interface MediaItem {
    url: string;
    type: 'image' | 'video' | 'youtube';
}

export interface PostData {
    id: string;
    content: string;
    created_at: string;
    author_id: string;
    media_url?: string | null;
    media_type?: 'image' | 'video' | string | null;
    gallery?: MediaItem[];
    actions_count?: number;
    replies_count?: number;
    bookmark_count?: number;
    shares_count?: number;
}

// 2. Định nghĩa kiểu dữ liệu cho Author (User info)
export interface AuthorData {
    name: string;
    handle: string;
    avatar: string;
}

// 3. Props của Component
interface FeedCardProps {
    post: PostData;
    author: AuthorData;
}

// Helper: Format thời gian
const formatTime = (isoString: string): string => {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
        }).format(date);
    } catch (e) {
        return "";
    }
};

// Helper: Convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        let videoId: string | null = null;
        const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]+)/);
        if (watchMatch) {
            videoId = watchMatch[1];
        }
        const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (shortMatch) {
            videoId = shortMatch[1];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (e) {
        console.error('YouTube URL conversion error:', e);
        return null;
    }
};

// Helper: Check if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return /(?:youtube\.com|youtu\.be)/.test(url);
};

// Gallery Component
interface GalleryProps {
    items: MediaItem[];
}

const Gallery: React.FC<GalleryProps> = ({ items }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [_, setImageDimensions] = useState<{ [key: number]: number }>({});
    const [maxHeight, setMaxHeight] = useState<number | null>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    if (!items || items.length === 0) return null;

    const currentItem = items[selectedIndex];
    const embedUrl = currentItem.type === 'youtube' ? getYouTubeEmbedUrl(currentItem.url) : null;
    const isMultipleItems = items.length > 1;

    // Dùng maxHeight động, nếu chưa load thì dùng default
    const containerHeight = maxHeight ? `${maxHeight}px` : (isMultipleItems ? '280px' : '400px');

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.offsetWidth;
        const newIndex = Math.round(scrollLeft / containerWidth);
        setSelectedIndex(Math.min(newIndex, items.length - 1));
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>, index: number) => {
        const img = e.currentTarget;
        const actualHeight = img.naturalHeight;

        setImageDimensions(prev => {
            const updated = { ...prev, [index]: actualHeight };

            const heights = Object.values(updated);
            if (heights.length > 0) {
                const maxH = Math.max(...heights);
                const limitedMaxHeight = isMultipleItems ? Math.min(maxH, 300) : Math.min(maxH, 500);
                setMaxHeight(limitedMaxHeight);
            }

            return updated;
        });
    };

    return (
        <>
            {/* Horizontal Carousel Layout for Multiple Items */}
            {isMultipleItems ? (
                <div className="rounded-xl overflow-hidden mt-2 w-full bg-secondary relative group">
                    <div
                        ref={scrollContainerRef}
                        className="flex bg-secondary overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide gap-2 px-2"
                        style={{
                            scrollBehavior: 'smooth',
                            scrollSnapType: 'x mandatory',
                            WebkitOverflowScrolling: 'touch',
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none',
                            height: containerHeight
                        }}
                        onScroll={handleScroll}
                    >
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="shrink-0 snap-start relative rounded overflow-hidden flex items-center justify-center"
                                style={{
                                    width: 'auto',
                                    height: '100%',
                                    minWidth: '0'
                                }}
                                onClick={() => {
                                    setSelectedIndex(index);
                                    setShowLightbox(true);
                                }}
                            >
                                {item.type === 'youtube' ? (
                                    <div className="h-full bg-secondary flex items-center justify-center">
                                        <img
                                            src={`https://img.youtube.com/vi/${item.url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]}/mqdefault.jpg`}
                                            alt="YouTube thumbnail"
                                            className="h-full w-auto object-contain"
                                            onLoad={(e) => handleImageLoad(e, index)}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                                            <Play size={32} className="text-white fill-white" />
                                        </div>
                                    </div>
                                ) : item.type === 'video' ? (
                                    <>
                                        <video
                                            className="h-full w-auto object-contain"
                                            src={item.url}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                                            <Play size={32} className="text-white fill-white" />
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={item.url}
                                        alt={`Gallery item ${index + 1}`}
                                        className="h-full w-auto object-contain"
                                        loading="lazy"
                                        onLoad={(e) => handleImageLoad(e, index)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Single Item - Original Carousel Layout */
                <div className="rounded-xl overflow-hidden border border-border mt-2 w-full bg-black relative group">
                    <div
                        ref={scrollContainerRef}
                        className="flex bg-black overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
                        style={{
                            scrollBehavior: 'smooth',
                            scrollSnapType: 'x mandatory',
                            WebkitOverflowScrolling: 'touch',
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none',
                            height: containerHeight
                        }}
                        onScroll={handleScroll}
                    >
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="shrink-0 bg-black snap-start relative rounded overflow-hidden flex items-center justify-center"
                                style={{
                                    width: '100%',
                                    height: '100%'
                                }}
                                onClick={() => {
                                    setSelectedIndex(index);
                                    setShowLightbox(true);
                                }}
                            >
                                {item.type === 'youtube' ? (
                                    <div className="w-full h-full bg-black flex items-center justify-center">
                                        <img
                                            src={`https://img.youtube.com/vi/${item.url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]}/mqdefault.jpg`}
                                            alt="YouTube thumbnail"
                                            className="w-auto max-h-full object-contain"
                                            onLoad={(e) => handleImageLoad(e, index)}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                                            <Play size={32} className="text-white fill-white" />
                                        </div>
                                    </div>
                                ) : item.type === 'video' ? (
                                    <>
                                        <video
                                            className="w-auto max-h-full object-contain"
                                            src={item.url}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                                            <Play size={32} className="text-white fill-white" />
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={item.url}
                                        alt={`Gallery item ${index + 1}`}
                                        className="w-auto max-h-full object-contain"
                                        loading="lazy"
                                        onLoad={(e) => handleImageLoad(e, index)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {showLightbox && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
                    <button
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
                    >
                        <X size={24} />
                    </button>

                    {currentItem.type === 'youtube' ? (
                        <div className="relative w-full max-w-4xl bg-black" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                src={embedUrl!}
                                title={`YouTube video ${selectedIndex + 1}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full"
                            />
                        </div>
                    ) : currentItem.type === 'image' ? (
                        <img
                            src={currentItem.url}
                            alt={`Lightbox ${selectedIndex + 1}`}
                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                        />
                    ) : (
                        <video
                            controls
                            autoPlay
                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                            src={currentItem.url}
                        />
                    )}
                </div>
            )}
        </>
    );
};

const FeedCard: React.FC<FeedCardProps> = ({
    post,
    author
}) => {
    const [showSingleMediaLightbox, setShowSingleMediaLightbox] = useState(false);

    // Optimistic UI: Local state cho action counts
    const [localCounts, setLocalCounts] = useState({
        likes: post.actions_count || 0,
        replies: post.replies_count || 0,
        bookmarks: post.bookmark_count || 0,
        shares: post.shares_count || 0,
    });

    // Trạng thái để theo dõi actions đã được thực hiện (optimistic)
    const [actionStates, setActionStates] = useState({
        liked: false,
        bookmarked: false,
        shared: false,
    });

    // Hàm xử lý like với Optimistic UI
    const handleLike = useCallback(() => {
        setActionStates(prev => ({ ...prev, liked: !prev.liked }));
        setLocalCounts(prev => ({
            ...prev,
            likes: prev.likes + (actionStates.liked ? -1 : 1),
        }));
        // TODO: Gửi request tới API
        console.log("Like post:", post.id);
    }, [actionStates.liked, post.id]);

    // Hàm xử lý bookmark với Optimistic UI
    const handleBookmark = useCallback(() => {
        setActionStates(prev => ({ ...prev, bookmarked: !prev.bookmarked }));
        setLocalCounts(prev => ({
            ...prev,
            bookmarks: prev.bookmarks + (actionStates.bookmarked ? -1 : 1),
        }));
        // TODO: Gửi request tới API
        console.log("Bookmark post:", post.id);
    }, [actionStates.bookmarked, post.id]);

    // Hàm xử lý share với Optimistic UI
    const handleShare = useCallback(() => {
        setActionStates(prev => ({ ...prev, shared: !prev.shared }));
        setLocalCounts(prev => ({
            ...prev,
            shares: prev.shares + (actionStates.shared ? -1 : 1),
        }));
        // TODO: Gửi request tới API
        console.log("Share post:", post.id);
    }, [actionStates.shared, post.id]);

    // Hàm xử lý reply (comment)
    const handleReply = useCallback(async () => {
        // Sau khi API trả về thành công, mới tăng replies (Optimistic after actual post)
        setLocalCounts(prev => ({ ...prev, replies: prev.replies + 1 }));
        console.log('Comment posted for post:', post.id);
    }, [post.id]);

    // Check if has gallery or single media
    const hasGallery = post.gallery && post.gallery.length > 0;
    const hasSingleMedia = post.media_url && !hasGallery;
    const isYoutube = hasSingleMedia ? isYouTubeUrl(post.media_url!) : false;
    const embedUrl = isYoutube ? getYouTubeEmbedUrl(post.media_url!) : null;

    const postActions = [
        {
            id: "bookmark",
            label: "Save",
            icon: <Bookmark size={16} />,
            onClick: () => console.log("Save post", post.id),
            isVisible: true,
            showSeparatorAfter: true,

        },
        {
            id: "edit",
            label: "Edit",
            icon: <Edit3 size={16} />,
            onClick: () => console.log("Edit post", post.id),
            isVisible: post.author_id === "currentUserId",
        },
        {
            id: "block",
            label: "Block",
            icon: <Ban size={16} />,
            onClick: () => console.log("Block post", post.id),
            isVisible: post.author_id !== "currentUserId",
            showSeparatorAfter: true,
            variant: "destructive" as const,
        },
        {
            id: "copy-link",
            label: "Copy link",
            icon: <Link2 size={16} />,
            onClick: () => {
                const postUrl = `${window.location.origin}/post/${post.id}`;
                navigator.clipboard.writeText(postUrl);
                console.log("Link copied:", postUrl);
            },
            isVisible: true,
        },
    ];

    return (
        <Card className="w-full max-w-2xl bg-secondary text-foreground border-border mb-4">

            {/* HEADER */}
            <CardHeader className="flex flex-row items-center gap-3 px-4 -mt-3 pb-0">
                <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback>{author.name ? author.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text hover:underline cursor-pointer text-foreground">
                            {author.name}
                        </span>
                        <span className="text-text-secondary text-ft">
                            {author.handle}
                        </span>
                        <span className="text-text-muted text-xs">
                            {formatTime(post.created_at)}
                        </span>
                    </div>
                </div>
                <DropdownExtend
                    actions={postActions}
                    triggerType="icon"
                    align="center"
                />
            </CardHeader>

            {/* CONTENT */}
            <CardContent className="py-0 pb-0 flex gap-3 px-4 -mt-4">
                <div className="spacer-column"></div>
                <div className="flex-1 min-w-0">
                    {/* Text Content */}
                    {post.content && (
                        <p className="text-sm leading-relaxed text-foreground whitespace-normal mb-1 wrap-break-words">
                            {post.content}
                        </p>
                    )}

                    {/* Gallery or Single Media */}
                    {hasGallery ? (
                        <Gallery items={post.gallery!} />
                    ) : hasSingleMedia && (
                        <>
                            <div
                                className="rounded-lg overflow-hidden mt-2 w-full cursor-pointer"
                                onClick={() => setShowSingleMediaLightbox(true)}
                            >
                                {embedUrl ? (
                                    <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                                        <iframe
                                            src={embedUrl}
                                            title="YouTube video"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute top-0 left-0 w-full h-full"
                                        />
                                    </div>
                                ) : post.media_type === 'video' ? (
                                    <video
                                        controls
                                        className="media-content max-h-96 w-full object-cover"
                                        src={post.media_url!}
                                    />
                                ) : (
                                    <img
                                        src={post.media_url!}
                                        alt="Post media"
                                        className="media-content w-full h-auto object-contain object-left"
                                        loading="lazy"
                                    />
                                )}
                            </div>

                            {/* Single Media Lightbox */}
                            {showSingleMediaLightbox && (
                                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
                                    <button
                                        onClick={() => setShowSingleMediaLightbox(false)}
                                        className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
                                    >
                                        <X size={24} />
                                    </button>

                                    {embedUrl ? (
                                        <div className="relative w-full max-w-4xl bg-black" style={{ paddingBottom: '56.25%' }}>
                                            <iframe
                                                src={embedUrl}
                                                title="YouTube video"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="absolute top-0 left-0 w-full h-full"
                                            />
                                        </div>
                                    ) : post.media_type === 'video' ? (
                                        <video
                                            controls
                                            autoPlay
                                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                                            src={post.media_url!}
                                        />
                                    ) : (
                                        <img
                                            src={post.media_url!}
                                            alt="Post media lightbox"
                                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="spacer-column"></div>
            </CardContent>

            {/* FOOTER */}
            <CardFooter className="flex gap-3 px-4 -pb-3 -mb-3 -pt-10 -mt-5">
                <div className="spacer-column"></div>
                <div className="flex-1 flex gap-4 justify-start">
                    <ActionButton 
                        actionId="like"
                        icon={<Heart size={24} />} 
                        count={localCounts.likes}
                        onClick={handleLike}
                        isActive={actionStates.liked}
                    />
                    <ActionButton 
                        actionId="reply"
                        icon={<MessageSquare size={24} />} 
                        count={localCounts.replies}
                        onClick={handleReply}
                    />
                    <ActionButton 
                        actionId="bookmark"
                        icon={<Bookmark size={24} />} 
                        count={localCounts.bookmarks}
                        onClick={handleBookmark}
                        isActive={actionStates.bookmarked}
                    />
                    <ActionButton 
                        actionId="share"
                        icon={<Repeat2 size={24} />} 
                        count={localCounts.shares}
                        onClick={handleShare}
                        isActive={actionStates.shared}
                    />
                    <ActionButton icon={<Send size={24} />} />
                </div>
                <div className="spacer-column"></div>
            </CardFooter>
        </Card>
    );
};

// Component con cho nút bấm
interface ActionButtonProps {
    actionId?: string;
    icon: React.ReactNode;
    count?: number;
    onClick?: () => void;
    isActive?: boolean;
}

// const ActionButton: React.FC<ActionButtonProps> = ({ icon, count }) => (
const ActionButton: React.FC<ActionButtonProps> = ({ actionId, icon, count, onClick, isActive }) => {
    // Determine active classes per action
    let activeButtonClasses = '';
    let iconExtraClasses = '';

    if (isActive) {
        switch (actionId) {
            case 'like':
                // solid/filled red heart (use a slightly warmer red)
                activeButtonClasses = 'text-rose-600 hover:text-rose-700';
                iconExtraClasses = 'fill-current';
                break;
            case 'bookmark':
                // yellow solid bookmark when saved
                activeButtonClasses = 'text-yellow-400 hover:text-yellow-500';
                iconExtraClasses = 'fill-current';
                break;
            case 'share':
                // blue outline for repost/share icon
                activeButtonClasses = 'text-blue-600 hover:text-blue-700';
                iconExtraClasses = 'stroke-2 stroke-blue-600';
                break;
            default:
                activeButtonClasses = 'text-foreground';
                iconExtraClasses = 'fill-current';
        }
    } else {
        activeButtonClasses = 'text-text-secondary hover:text-foreground';
    }

    // Inject classes into the passed icon element safely
    const renderedIcon = React.isValidElement(icon)
        ? React.cloneElement(icon as any, { className: `${(icon as any).props.className || ''} ${iconExtraClasses}`.trim() })
        : icon;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={`action-button-base w-8 h-8 flex items-center gap-1 transition-all ${activeButtonClasses}`}
        >
            {renderedIcon}
            {count !== undefined && count > 0 && (
                <span className="small-text text-xs">{count}</span>
            )}
        </Button>
    );
};

export default FeedCard;






// import React, { useState, useCallback } from 'react';
// import { apiClient } from '@/lib/api-client';
// import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { MessageSquare, Bookmark, Repeat2, Heart, Send, X, Play, Edit3, Ban, Link2 } from "lucide-react";
// import { DropdownExtend } from './DropdownExtend';
// // 1. Định nghĩa kiểu dữ liệu cho Post (khớp với Firestore)
// export interface MediaItem {
//     url: string;
//     type: 'image' | 'video' | 'youtube';
// }

// export interface PostData {
//     id: string;
//     content: string;
//     created_at: string;
//     author_id: string;
//     media_url?: string | null;
//     media_type?: 'image' | 'video' | string | null;
//     gallery?: MediaItem[];
//     actions_count?: number;
//     replies_count?: number;
//     bookmark_count?: number;
//     shares_count?: number;
// }

// // 2. Định nghĩa kiểu dữ liệu cho Author (User info)
// export interface AuthorData {
//     name: string;
//     handle: string;
//     avatar: string;
// }

// // 3. Props của Component
// interface FeedCardProps {
//     post: PostData;
//     author: AuthorData;
// }

// // Helper: Format thời gian
// const formatTime = (isoString: string): string => {
//     if (!isoString) return "";
//     try {
//         const date = new Date(isoString);
//         return new Intl.DateTimeFormat('en-US', {
//             month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
//         }).format(date);
//     } catch (e) {
//         return "";
//     }
// };

// // Helper: Convert YouTube URL to embed URL
// const getYouTubeEmbedUrl = (url: string): string | null => {
//     if (!url) return null;
//     try {
//         let videoId: string | null = null;
//         const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]+)/);
//         if (watchMatch) {
//             videoId = watchMatch[1];
//         }
//         const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
//         if (shortMatch) {
//             videoId = shortMatch[1];
//         }
//         return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
//     } catch (e) {
//         console.error('YouTube URL conversion error:', e);
//         return null;
//     }
// };

// // Helper: Check if URL is YouTube
// const isYouTubeUrl = (url: string): boolean => {
//     if (!url) return false;
//     return /(?:youtube\.com|youtu\.be)/.test(url);
// };

// // Gallery Component
// interface GalleryProps {
//     items: MediaItem[];
// }

// const Gallery: React.FC<GalleryProps> = ({ items }) => {
//     const [selectedIndex, setSelectedIndex] = useState(0);
//     const [showLightbox, setShowLightbox] = useState(false);
//     const [_, setImageDimensions] = useState<{ [key: number]: number }>({});
//     const [maxHeight, setMaxHeight] = useState<number | null>(null);
//     const scrollContainerRef = React.useRef<HTMLDivElement>(null);

//     if (!items || items.length === 0) return null;

//     const currentItem = items[selectedIndex];
//     const embedUrl = currentItem.type === 'youtube' ? getYouTubeEmbedUrl(currentItem.url) : null;
//     const isMultipleItems = items.length > 1;

//     // Dùng maxHeight động, nếu chưa load thì dùng default
//     const containerHeight = maxHeight ? `${maxHeight}px` : (isMultipleItems ? '280px' : '400px');

//     const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
//         const container = e.currentTarget;
//         const scrollLeft = container.scrollLeft;
//         const containerWidth = container.offsetWidth;
//         const newIndex = Math.round(scrollLeft / containerWidth);
//         setSelectedIndex(Math.min(newIndex, items.length - 1));
//     };

//     const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>, index: number) => {
//         const img = e.currentTarget;
//         const actualHeight = img.naturalHeight;

//         setImageDimensions(prev => {
//             const updated = { ...prev, [index]: actualHeight };

//             const heights = Object.values(updated);
//             if (heights.length > 0) {
//                 const maxH = Math.max(...heights);
//                 const limitedMaxHeight = isMultipleItems ? Math.min(maxH, 300) : Math.min(maxH, 500);
//                 setMaxHeight(limitedMaxHeight);
//             }

//             return updated;
//         });
//     };

//     return (
//         <>
//             {/* Horizontal Carousel Layout for Multiple Items */}
//             {isMultipleItems ? (
//                 <div className="rounded-xl overflow-hidden mt-2 w-full bg-secondary relative group">
//                     <div
//                         ref={scrollContainerRef}
//                         className="flex bg-secondary overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide gap-2 px-2"
//                         style={{
//                             scrollBehavior: 'smooth',
//                             scrollSnapType: 'x mandatory',
//                             WebkitOverflowScrolling: 'touch',
//                             msOverflowStyle: 'none',
//                             scrollbarWidth: 'none',
//                             height: containerHeight
//                         }}
//                         onScroll={handleScroll}
//                     >
//                         {items.map((item, index) => (
//                             <div
//                                 key={index}
//                                 className="shrink-0 snap-start relative rounded overflow-hidden flex items-center justify-center"
//                                 style={{
//                                     width: 'auto',
//                                     height: '100%',
//                                     minWidth: '0'
//                                 }}
//                                 onClick={() => {
//                                     setSelectedIndex(index);
//                                     setShowLightbox(true);
//                                 }}
//                             >
//                                 {item.type === 'youtube' ? (
//                                     <div className="h-full bg-secondary flex items-center justify-center">
//                                         <img
//                                             src={`https://img.youtube.com/vi/${item.url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]}/mqdefault.jpg`}
//                                             alt="YouTube thumbnail"
//                                             className="h-full w-auto object-contain"
//                                             onLoad={(e) => handleImageLoad(e, index)}
//                                         />
//                                         <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
//                                             <Play size={32} className="text-white fill-white" />
//                                         </div>
//                                     </div>
//                                 ) : item.type === 'video' ? (
//                                     <>
//                                         <video
//                                             className="h-full w-auto object-contain"
//                                             src={item.url}
//                                         />
//                                         <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
//                                             <Play size={32} className="text-white fill-white" />
//                                         </div>
//                                     </>
//                                 ) : (
//                                     <img
//                                         src={item.url}
//                                         alt={`Gallery item ${index + 1}`}
//                                         className="h-full w-auto object-contain"
//                                         loading="lazy"
//                                         onLoad={(e) => handleImageLoad(e, index)}
//                                     />
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             ) : (
//                 /* Single Item - Original Carousel Layout */
//                 <div className="rounded-xl overflow-hidden border border-border mt-2 w-full bg-black relative group">
//                     <div
//                         ref={scrollContainerRef}
//                         className="flex bg-black overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
//                         style={{
//                             scrollBehavior: 'smooth',
//                             scrollSnapType: 'x mandatory',
//                             WebkitOverflowScrolling: 'touch',
//                             msOverflowStyle: 'none',
//                             scrollbarWidth: 'none',
//                             height: containerHeight
//                         }}
//                         onScroll={handleScroll}
//                     >
//                         {items.map((item, index) => (
//                             <div
//                                 key={index}
//                                 className="shrink-0 bg-black snap-start relative rounded overflow-hidden flex items-center justify-center"
//                                 style={{
//                                     width: '100%',
//                                     height: '100%'
//                                 }}
//                                 onClick={() => {
//                                     setSelectedIndex(index);
//                                     setShowLightbox(true);
//                                 }}
//                             >
//                                 {item.type === 'youtube' ? (
//                                     <div className="w-full h-full bg-black flex items-center justify-center">
//                                         <img
//                                             src={`https://img.youtube.com/vi/${item.url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]}/mqdefault.jpg`}
//                                             alt="YouTube thumbnail"
//                                             className="w-auto max-h-full object-contain"
//                                             onLoad={(e) => handleImageLoad(e, index)}
//                                         />
//                                         <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
//                                             <Play size={32} className="text-white fill-white" />
//                                         </div>
//                                     </div>
//                                 ) : item.type === 'video' ? (
//                                     <>
//                                         <video
//                                             className="w-auto max-h-full object-contain"
//                                             src={item.url}
//                                         />
//                                         <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
//                                             <Play size={32} className="text-white fill-white" />
//                                         </div>
//                                     </>
//                                 ) : (
//                                     <img
//                                         src={item.url}
//                                         alt={`Gallery item ${index + 1}`}
//                                         className="w-auto max-h-full object-contain"
//                                         loading="lazy"
//                                         onLoad={(e) => handleImageLoad(e, index)}
//                                     />
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* Lightbox */}
//             {showLightbox && (
//                 <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
//                     <button
//                         onClick={() => setShowLightbox(false)}
//                         className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
//                     >
//                         <X size={24} />
//                     </button>

//                     {currentItem.type === 'youtube' ? (
//                         <div className="relative w-full max-w-4xl bg-black" style={{ paddingBottom: '56.25%' }}>
//                             <iframe
//                                 src={embedUrl!}
//                                 title={`YouTube video ${selectedIndex + 1}`}
//                                 frameBorder="0"
//                                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                                 allowFullScreen
//                                 className="absolute top-0 left-0 w-full h-full"
//                             />
//                         </div>
//                     ) : currentItem.type === 'image' ? (
//                         <img
//                             src={currentItem.url}
//                             alt={`Lightbox ${selectedIndex + 1}`}
//                             className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
//                         />
//                     ) : (
//                         <video
//                             controls
//                             autoPlay
//                             className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
//                             src={currentItem.url}
//                         />
//                     )}
//                 </div>
//             )}
//         </>
//     );
// };

// const FeedCard: React.FC<FeedCardProps> = ({
//     post,
//     author
// }) => {
//     const [showSingleMediaLightbox, setShowSingleMediaLightbox] = useState(false);

//     // Optimistic UI: Local state cho action counts
//     const [localCounts, setLocalCounts] = useState({
//         likes: post.actions_count || 0,
//         replies: post.replies_count || 0,
//         bookmarks: post.bookmark_count || 0,
//         shares: post.shares_count || 0,
//     });

//     // Trạng thái để theo dõi actions đã được thực hiện (optimistic)
//     const [actionStates, setActionStates] = useState({
//         liked: false,
//         bookmarked: false,
//         shared: false,
//     });

//     // Hàm xử lý like với Optimistic UI
//     const handleLike = useCallback(async () => {
//         setActionStates(prev => ({ ...prev, liked: !prev.liked }));
//         setLocalCounts(prev => ({
//             ...prev,
//             likes: prev.likes + (actionStates.liked ? -1 : 1),
//         }));
        
//         try {
//             await apiClient.post(`/api/v1/posts/${post.id}/like`);
//         } catch (error) {
//             console.error("Error liking post:", error);
//             // Revert optimistic UI on error
//             setActionStates(prev => ({ ...prev, liked: !prev.liked }));
//             setLocalCounts(prev => ({
//                 ...prev,
//                 likes: prev.likes - (actionStates.liked ? -1 : 1),
//             }));
//         }
//     }, [actionStates.liked, post.id]);

//     // Hàm xử lý bookmark với Optimistic UI
//     const handleBookmark = useCallback(async () => {
//         setActionStates(prev => ({ ...prev, bookmarked: !prev.bookmarked }));
//         setLocalCounts(prev => ({
//             ...prev,
//             bookmarks: prev.bookmarks + (actionStates.bookmarked ? -1 : 1),
//         }));
        
//         try {
//             await apiClient.post(`/api/v1/posts/${post.id}/save`);
//         } catch (error) {
//             console.error("Error saving post:", error);
//             // Revert optimistic UI on error
//             setActionStates(prev => ({ ...prev, bookmarked: !prev.bookmarked }));
//             setLocalCounts(prev => ({
//                 ...prev,
//                 bookmarks: prev.bookmarks - (actionStates.bookmarked ? -1 : 1),
//             }));
//         }
//     }, [actionStates.bookmarked, post.id]);

//     // Hàm xử lý share với Optimistic UI
//     const handleShare = useCallback(async () => {
//         setActionStates(prev => ({ ...prev, shared: !prev.shared }));
//         setLocalCounts(prev => ({
//             ...prev,
//             shares: prev.shares + (actionStates.shared ? -1 : 1),
//         }));
        
//         try {
//             await apiClient.post(`/api/v1/posts/${post.id}/share`);
//         } catch (error) {
//             console.error("Error sharing post:", error);
//             // Revert optimistic UI on error
//             setActionStates(prev => ({ ...prev, shared: !prev.shared }));
//             setLocalCounts(prev => ({
//                 ...prev,
//                 shares: prev.shares - (actionStates.shared ? -1 : 1),
//             }));
//         }
//     }, [actionStates.shared, post.id]);

//     // Hàm xử lý reply (comment)
//     const handleReply = useCallback(() => {
//         setLocalCounts(prev => ({ ...prev, replies: prev.replies + 1 }));
//         console.log('Comment posted for post:', post.id);
//     }, [post.id]);
    
//     // Hàm để gửi comment text tới API
//     const submitComment = useCallback(async (commentText: string) => {
//         try {
//             await apiClient.post(`/api/v1/posts/${post.id}/comments`, {
//                 text: commentText
//             });
//             handleReply();
//         } catch (error) {
//             console.error("Error posting comment:", error);
//             throw error;
//         }
//     }, [post.id, handleReply]);

//     // Check if has gallery or single media
//     const hasGallery = post.gallery && post.gallery.length > 0;
//     const hasSingleMedia = post.media_url && !hasGallery;
//     const isYoutube = hasSingleMedia ? isYouTubeUrl(post.media_url!) : false;
//     const embedUrl = isYoutube ? getYouTubeEmbedUrl(post.media_url!) : null;

//     const postActions = [
//         {
//             id: "bookmark",
//             label: "Save",
//             icon: <Bookmark size={16} />,
//             onClick: () => console.log("Save post", post.id),
//             isVisible: true,
//             showSeparatorAfter: true,

//         },
//         {
//             id: "edit",
//             label: "Edit",
//             icon: <Edit3 size={16} />,
//             onClick: () => console.log("Edit post", post.id),
//             isVisible: post.author_id === "currentUserId",
//         },
//         {
//             id: "block",
//             label: "Block",
//             icon: <Ban size={16} />,
//             onClick: () => console.log("Block post", post.id),
//             isVisible: post.author_id !== "currentUserId",
//             showSeparatorAfter: true,
//             variant: "destructive" as const,
//         },
//         {
//             id: "copy-link",
//             label: "Copy link",
//             icon: <Link2 size={16} />,
//             onClick: () => {
//                 const postUrl = `${window.location.origin}/post/${post.id}`;
//                 navigator.clipboard.writeText(postUrl);
//                 console.log("Link copied:", postUrl);
//             },
//             isVisible: true,
//         },
//     ];

//     return (
//         <Card className="w-full max-w-2xl bg-secondary text-foreground border-border mb-4">

//             {/* HEADER */}
//             <CardHeader className="flex flex-row items-center gap-3 px-4 -mt-3 pb-0">
//                 <Avatar className="w-10 h-10 shrink-0">
//                     <AvatarImage src={author.avatar} alt={author.name} />
//                     <AvatarFallback>{author.name ? author.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
//                 </Avatar>
//                 <div className="flex flex-col flex-1">
//                     <div className="flex items-center gap-2">
//                         <span className="text hover:underline cursor-pointer text-foreground">
//                             {author.name}
//                         </span>
//                         <span className="text-text-secondary text-ft">
//                             {author.handle}
//                         </span>
//                         <span className="text-text-muted text-xs">
//                             {formatTime(post.created_at)}
//                         </span>
//                     </div>
//                 </div>
//                 <DropdownExtend
//                     actions={postActions}
//                     triggerType="icon"
//                     align="center"
//                 />
//             </CardHeader>

//             {/* CONTENT */}
//             <CardContent className="py-0 pb-0 flex gap-3 px-4 -mt-4">
//                 <div className="spacer-column"></div>
//                 <div className="flex-1 min-w-0">
//                     {/* Text Content */}
//                     {post.content && (
//                         <p className="text-sm leading-relaxed text-foreground whitespace-normal mb-1 wrap-break-words">
//                             {post.content}
//                         </p>
//                     )}

//                     {/* Gallery or Single Media */}
//                     {hasGallery ? (
//                         <Gallery items={post.gallery!} />
//                     ) : hasSingleMedia && (
//                         <>
//                             <div
//                                 className="rounded-lg overflow-hidden mt-2 w-full cursor-pointer"
//                                 onClick={() => setShowSingleMediaLightbox(true)}
//                             >
//                                 {embedUrl ? (
//                                     <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
//                                         <iframe
//                                             src={embedUrl}
//                                             title="YouTube video"
//                                             frameBorder="0"
//                                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                                             allowFullScreen
//                                             className="absolute top-0 left-0 w-full h-full"
//                                         />
//                                     </div>
//                                 ) : post.media_type === 'video' ? (
//                                     <video
//                                         controls
//                                         className="media-content max-h-96 w-full object-cover"
//                                         src={post.media_url!}
//                                     />
//                                 ) : (
//                                     <img
//                                         src={post.media_url!}
//                                         alt="Post media"
//                                         className="media-content w-full h-auto object-contain object-left"
//                                         loading="lazy"
//                                     />
//                                 )}
//                             </div>

//                             {/* Single Media Lightbox */}
//                             {showSingleMediaLightbox && (
//                                 <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
//                                     <button
//                                         onClick={() => setShowSingleMediaLightbox(false)}
//                                         className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
//                                     >
//                                         <X size={24} />
//                                     </button>

//                                     {embedUrl ? (
//                                         <div className="relative w-full max-w-4xl bg-black" style={{ paddingBottom: '56.25%' }}>
//                                             <iframe
//                                                 src={embedUrl}
//                                                 title="YouTube video"
//                                                 frameBorder="0"
//                                                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                                                 allowFullScreen
//                                                 className="absolute top-0 left-0 w-full h-full"
//                                             />
//                                         </div>
//                                     ) : post.media_type === 'video' ? (
//                                         <video
//                                             controls
//                                             autoPlay
//                                             className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
//                                             src={post.media_url!}
//                                         />
//                                     ) : (
//                                         <img
//                                             src={post.media_url!}
//                                             alt="Post media lightbox"
//                                             className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
//                                         />
//                                     )}
//                                 </div>
//                             )}
//                         </>
//                     )}
//                 </div>
//                 <div className="spacer-column"></div>
//             </CardContent>

//             {/* FOOTER */}
//             <CardFooter className="flex gap-3 px-4 -pb-3 -mb-3 -pt-10 -mt-5">
//                 <div className="spacer-column"></div>
//                 <div className="flex-1 flex gap-4 justify-start">
//                     <ActionButton 
//                         actionId="like"
//                         icon={<Heart size={24} />} 
//                         count={localCounts.likes}
//                         onClick={handleLike}
//                         isActive={actionStates.liked}
//                     />
//                     <ActionButton 
//                         actionId="reply"
//                         icon={<MessageSquare size={24} />} 
//                         count={localCounts.replies}
//                         onClick={handleReply}
//                     />
//                     <ActionButton 
//                         actionId="bookmark"
//                         icon={<Bookmark size={24} />} 
//                         count={localCounts.bookmarks}
//                         onClick={handleBookmark}
//                         isActive={actionStates.bookmarked}
//                     />
//                     <ActionButton 
//                         actionId="share"
//                         icon={<Repeat2 size={24} />} 
//                         count={localCounts.shares}
//                         onClick={handleShare}
//                         isActive={actionStates.shared}
//                     />
//                     <ActionButton icon={<Send size={24} />} />
//                 </div>
//                 <div className="spacer-column"></div>
//             </CardFooter>
//         </Card>
//     );
// };

// // Component con cho nút bấm
// interface ActionButtonProps {
//     actionId?: string;
//     icon: React.ReactNode;
//     count?: number;
//     onClick?: () => void;
//     isActive?: boolean;
// }

// // const ActionButton: React.FC<ActionButtonProps> = ({ icon, count }) => (
// const ActionButton: React.FC<ActionButtonProps> = ({ actionId, icon, count, onClick, isActive }) => {
//     // Determine active classes per action
//     let activeButtonClasses = '';
//     let iconExtraClasses = '';

//     if (isActive) {
//         switch (actionId) {
//             case 'like':
//                 // solid/filled red heart (use a slightly warmer red)
//                 activeButtonClasses = 'text-rose-600 hover:text-rose-700';
//                 iconExtraClasses = 'fill-current';
//                 break;
//             case 'bookmark':
//                 // yellow solid bookmark when saved
//                 activeButtonClasses = 'text-yellow-400 hover:text-yellow-500';
//                 iconExtraClasses = 'fill-current';
//                 break;
//             case 'share':
//                 // blue outline for repost/share icon
//                 activeButtonClasses = 'text-blue-600 hover:text-blue-700';
//                 iconExtraClasses = 'stroke-2 stroke-blue-600';
//                 break;
//             default:
//                 activeButtonClasses = 'text-foreground';
//                 iconExtraClasses = 'fill-current';
//         }
//     } else {
//         activeButtonClasses = 'text-text-secondary hover:text-foreground';
//     }

//     // Inject classes into the passed icon element safely
//     const renderedIcon = React.isValidElement(icon)
//         ? React.cloneElement(icon as any, { className: `${(icon as any).props.className || ''} ${iconExtraClasses}`.trim() })
//         : icon;

//     return (
//         <Button
//             variant="ghost"
//             size="icon"
//             onClick={onClick}
//             className={`action-button-base w-8 h-8 flex items-center gap-1 transition-all ${activeButtonClasses}`}
//         >
//             {renderedIcon}
//             {count !== undefined && count > 0 && (
//                 <span className="small-text text-xs">{count}</span>
//             )}
//         </Button>
//     );
// };

// export default FeedCard;



