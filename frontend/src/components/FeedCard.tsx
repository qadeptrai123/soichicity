import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bookmark, Repeat2, Heart, Send, MoreHorizontal, X, ChevronLeft, ChevronRight, Play } from "lucide-react";

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
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    if (!items || items.length === 0) return null;

    const currentItem = items[selectedIndex];
    const embedUrl = currentItem.type === 'youtube' ? getYouTubeEmbedUrl(currentItem.url) : null;

    const handlePrev = () => {
        setSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
        if (scrollContainerRef.current) {
            const newIndex = selectedIndex === 0 ? items.length - 1 : selectedIndex - 1;
            scrollContainerRef.current.scrollLeft = newIndex * scrollContainerRef.current.offsetWidth;
        }
    };

    const handleNext = () => {
        setSelectedIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
        if (scrollContainerRef.current) {
            const newIndex = selectedIndex === items.length - 1 ? 0 : selectedIndex + 1;
            scrollContainerRef.current.scrollLeft = newIndex * scrollContainerRef.current.offsetWidth;
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.offsetWidth;
        const newIndex = Math.round(scrollLeft / containerWidth);
        setSelectedIndex(Math.min(newIndex, items.length - 1));
    };

    const handleDotClick = (index: number) => {
        setSelectedIndex(index);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = index * scrollContainerRef.current.offsetWidth;
        }
    };

    return (
        <>
            <div className="rounded-xl overflow-hidden border border-border mt-2 w-full bg-black relative group">
                {/* Horizontal carousel - side by side */}
                <div
                    ref={scrollContainerRef}
                    className="flex bg-black overflow-x-auto scroll-smooth snap-x snap-mandatory"
                    style={{
                        scrollBehavior: 'smooth',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch'
                    }}
                    onScroll={handleScroll}
                >
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 bg-black snap-start"
                            style={{ width: '100%', aspectRatio: '1' }}
                        >
                            {item.type === 'youtube' ? (
                                <div className="relative w-full h-full bg-black">
                                    <iframe
                                        src={getYouTubeEmbedUrl(item.url)!}
                                        title={`YouTube video ${index + 1}`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="absolute top-0 left-0 w-full h-full"
                                    />
                                </div>
                            ) : item.type === 'video' ? (
                                <div className="relative w-full h-full bg-black cursor-pointer" onClick={() => setShowLightbox(true)}>
                                    <video
                                        className="w-full h-full object-cover"
                                        src={item.url}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition">
                                        <Play size={48} className="text-white fill-white" />
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={item.url}
                                    alt={`Gallery item ${index + 1}`}
                                    className="w-full h-full object-cover cursor-pointer"
                                    loading="lazy"
                                    onClick={() => {
                                        setSelectedIndex(index);
                                        setShowLightbox(true);
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Navigation Controls */}
                {items.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10 opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10 opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight size={20} />
                        </button>

                        {/* Indicator Dots */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {items.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleDotClick(index)}
                                    className={`transition-all rounded-full ${index === selectedIndex
                                        ? 'bg-white w-2 h-2'
                                        : 'bg-white/50 w-1.5 h-1.5 hover:bg-white/70'
                                        }`}
                                    aria-label={`Go to image ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Lightbox */}
            {showLightbox && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
                    <button
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
                    >
                        <X size={24} />
                    </button>

                    {currentItem.type === 'image' ? (
                        <img
                            src={currentItem.url}
                            alt={`Lightbox ${selectedIndex + 1}`}
                            className="max-w-4xl max-h-[90vh] object-contain"
                        />
                    ) : (
                        <video
                            controls
                            autoPlay
                            className="max-w-4xl max-h-[90vh]"
                            src={currentItem.url}
                        />
                    )}

                    {items.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </>
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
    // Check if has gallery or single media
    const hasGallery = post.gallery && post.gallery.length > 0;
    const hasSingleMedia = post.media_url && !hasGallery;
    const isYoutube = hasSingleMedia ? isYouTubeUrl(post.media_url!) : false;
    const embedUrl = isYoutube ? getYouTubeEmbedUrl(post.media_url!) : null;

    return (
        <Card className="w-full max-w-4xl bg-secondary text-foreground border-border mb-4">

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
                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0">
                    <MoreHorizontal size={16} />
                </Button>
            </CardHeader>

            {/* CONTENT */}
            <CardContent className="py-0 pb-0 flex gap-3 px-4 -mt-4">
                <div className="spacer-column"></div>
                <div className="flex-1 min-w-0">
                    {/* Text Content */}
                    {post.content && (
                        <p className="text-base leading-relaxed text-foreground whitespace-normal mb-1 wrap-break-words">
                            {post.content}
                        </p>
                    )}

                    {/* Gallery or Single Media */}
                    {hasGallery ? (
                        <Gallery items={post.gallery!} />
                    ) : hasSingleMedia && (
                        <div className="rounded-xl overflow-hidden border border-border mt-2 w-full">
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
                                    className="media-content"
                                    src={post.media_url!}
                                />
                            ) : (
                                <img
                                    src={post.media_url!}
                                    alt="Post media"
                                    className="media-content"
                                    loading="lazy"
                                />
                            )}
                        </div>
                    )}
                </div>
                <div className="spacer-column"></div>
            </CardContent>

            {/* FOOTER */}
            <CardFooter className="flex gap-3 px-4 -pb-3 -mb-3 -pt-10 -mt-5">
                <div className="spacer-column"></div>
                <div className="flex-1 flex gap-4 justify-start">
                    <ActionButton icon={<Heart size={24} />} count={post.actions_count} />
                    <ActionButton icon={<MessageSquare size={24} />} count={post.replies_count} />
                    <ActionButton icon={<Bookmark size={24} />} count={post.bookmark_count} />
                    <ActionButton icon={<Repeat2 size={24} />} count={post.shares_count} />
                    <ActionButton icon={<Send size={24} />} />
                </div>
                <div className="spacer-column"></div>
            </CardFooter>
        </Card>
    );
};

// Component con cho nút bấm
interface ActionButtonProps {
    icon: React.ReactNode;
    count?: number;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, count }) => (
    <Button
        variant="ghost"
        size="icon"
        className="action-button-base w-8 h-8 flex items-center gap-1"
    >
        {icon}
        {count !== undefined && count > 0 && (
            <span className="small-text">{count}</span>
        )}
    </Button>
);

export default FeedCard;