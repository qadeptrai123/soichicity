import React, { useState, useRef, useMemo, useEffect } from "react";
import { Play, X } from "lucide-react";

import type { MediaItem } from "@/types/common";
import { toast } from "sonner";

// Helper Functions
export const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        let videoId: string | null = null;
        const watchMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]+)/
        );
        if (watchMatch) videoId = watchMatch[1];
        const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (shortMatch) videoId = shortMatch[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (e) {
        console.error("YouTube URL conversion error:", e);
        return null;
    }
};

export const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return /(?:youtube\.com|youtu\.be)/.test(url);
};


const sortMediaItems = (items: MediaItem[]): MediaItem[] => {
    if (!items || items.length === 0) return items;

    const videos = items.filter(
        (item) => item.type === "video" || item.type === "youtube"
    );
    const images = items.filter((item) => item.type === "image");

    return [...videos, ...images];
};

// interface GalleryProps {
//     items: string[];
//     onDragStateChange?: (isDragging: boolean) => void;
//     className?: string; // Added for custom styling
//     size?: "small" | "medium" | "full"; // Responsive size field
// }
interface GalleryProps {
    items: string[];
    size?: "small" | "medium" | "full";
    onDragStateChange?: (dragging: boolean) => void;
    onOpen?: (url: string) => void;
    className?: string;
    hideBorder?: boolean;
}

const SIZE_MAP: Record<string, number | string> = {
    small: 250,
    medium: 500,
    full: "100%",
};

export const Gallery: React.FC<GalleryProps> = ({
    items,
    onDragStateChange,
    className,
    size = "medium",
    hideBorder = false,
}) => {
    // Determine height based on size prop
    const maxContainerHeight = SIZE_MAP[size];
    // Logic handled in variable definition above

    // Preprocess items
    const processedItems = useMemo(() => {
        if (!items) return [];
        return items.map(url => {
            const isYoutube = isYouTubeUrl(url);
            const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
            return {
                url,
                type: isYoutube ? "youtube" : isVideo ? "video" : "image"
            } as MediaItem;
        });
    }, [items]);

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [_, setImageDimensions] = useState<{ [key: number]: number }>({});
    const [maxHeight, setMaxHeight] = useState<number | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const scrollStartRef = useRef<number>(0);
    const mouseStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);



    if (!processedItems || processedItems.length === 0) return null;

    const sortedItems = sortMediaItems(processedItems);
    const currentItem = sortedItems[selectedIndex];
    const embedUrl =
        currentItem.type === "youtube" ? getYouTubeEmbedUrl(currentItem.url) : null;
    const isMultipleItems = processedItems.length > 1;

    // Use prop maxContainerHeight if provided, otherwise calculate
    const calculatedHeight = maxHeight
        ? `${maxHeight}px`
        : isMultipleItems
            ? "280px"
            : "400px";

    const containerHeight = maxContainerHeight || calculatedHeight;



    // Check overflow functionality
    const checkOverflow = () => {
        if (scrollContainerRef.current) {
            const { scrollWidth, clientWidth } = scrollContainerRef.current;
            setHasOverflow(scrollWidth > clientWidth + 2);
        }
    };

    useEffect(() => {
        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [sortedItems, containerHeight]);

    useEffect(() => {
        const timer = setTimeout(checkOverflow, 100);
        return () => clearTimeout(timer);
    }, [containerHeight]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isMultipleItems) return;

        e.preventDefault();
        scrollStartRef.current = scrollContainerRef.current?.scrollLeft || 0;
        mouseStartRef.current = { x: e.clientX, y: e.clientY };
        isDraggingRef.current = false;
        setIsDragging(false);
        onDragStateChange?.(false);

        const handleMouseMoveGlobal = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - mouseStartRef.current.x;
            const deltaY = Math.abs(moveEvent.clientY - mouseStartRef.current.y);

            if (Math.abs(deltaX) > 5 && !isDraggingRef.current && deltaY < 50) {
                isDraggingRef.current = true;
                setIsDragging(true);
                onDragStateChange?.(true);
            }

            // Scroll container khi dragging
            if (isDraggingRef.current && scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = scrollStartRef.current - deltaX;
            }
        };

        const handleMouseUpGlobal = () => {
            document.removeEventListener("mousemove", handleMouseMoveGlobal);
            document.removeEventListener("mouseup", handleMouseUpGlobal);
            isDraggingRef.current = false;
            setTimeout(() => {
                setIsDragging(false);
                onDragStateChange?.(false);
            }, 0);
        };

        document.addEventListener("mousemove", handleMouseMoveGlobal);
        document.addEventListener("mouseup", handleMouseUpGlobal);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (showLightbox) return; // ⛔ chặn khi đang xem lightbox

        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const containerWidth = container.offsetWidth;

        const scrollProgress = scrollLeft / (scrollWidth - containerWidth);
        const newIndex = Math.round(scrollProgress * (sortedItems.length - 1));

        setSelectedIndex(Math.max(0, Math.min(newIndex, sortedItems.length - 1)));
    };


    const handleImageLoad = (
        e: React.SyntheticEvent<HTMLImageElement>,
        index: number
    ) => {
        const img = e.currentTarget;
        const actualHeight = img.naturalHeight;
        setImageDimensions((prev) => {
            const updated = { ...prev, [index]: actualHeight };
            const heights = Object.values(updated);
            if (heights.length > 0) {
                const maxH = Math.max(...heights);
                const limitedMaxHeight = isMultipleItems
                    ? Math.min(maxH, 300)
                    : Math.min(maxH, 500);
                setMaxHeight(limitedMaxHeight);
            }
            return updated;
        });
    };

    // Hàm mở ảnh không làm trigger click bài viết
    const handleOpenMedia = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();

        // Chỉ mở lightbox nếu không phải drag
        if (!isDragging && !isDraggingRef.current) {
            setSelectedIndex(index);
            setShowLightbox(true);
        }
    };

    const handleDownloadCurrentMedia = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!currentItem?.url) {
            toast.error("No media to download");
            return;
        }

        const downloadUrl =
            "http://localhost:8000/api/media/download?url=" +
            encodeURIComponent(currentItem.url);

        window.location.href = downloadUrl;
    };

    // const handlePrev = (e: React.MouseEvent) => {
    // e.stopPropagation();
    // setSelectedIndex((prev) =>
    //     prev === 0 ? sortedItems.length - 1 : prev - 1
    // );
    // };

    // const handleNext = (e: React.MouseEvent) => {
    // e.stopPropagation();
    // setSelectedIndex((prev) =>
    //     prev === sortedItems.length - 1 ? 0 : prev + 1
    // );
    // };

    const goPrev = () => {
        setSelectedIndex((prev) =>
            prev === 0 ? sortedItems.length - 1 : prev - 1
        );
    };

    const goNext = () => {
        setSelectedIndex((prev) =>
            prev === sortedItems.length - 1 ? 0 : prev + 1
        );
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        goPrev();
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        goNext();
    };


    useEffect(() => {
        if (!showLightbox) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "Escape") setShowLightbox(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showLightbox, sortedItems.length]);


    return (
        <div className={className} data-gallery="true">
            {/* Carousel Layout */}
            <div
                className={`rounded-xl overflow-hidden mt-2 w-full relative group ${isMultipleItems || hideBorder ? "bg-transparent border-none" : "bg-transparent border border-border"
                    }`}
            >
                <div
                    ref={scrollContainerRef}
                    data-scroll-container="true"
                    className={`flex overflow-x-auto scrollbar-hide user-select-none ${isMultipleItems
                        ? "bg-transparent gap-2 px-0 cursor-grab active:cursor-grabbing"
                        : "bg-transparent"
                        }`}
                    style={{
                        scrollBehavior: "auto",
                        WebkitOverflowScrolling: "touch",
                        msOverflowStyle: "none",
                        scrollbarWidth: "none",
                        height: containerHeight,
                        pointerEvents: "auto",
                    }}
                    onScroll={handleScroll}
                    onMouseDown={handleMouseDown}
                >
                    {sortedItems.map((item, index) => (
                        <div
                            key={index}
                            className={`
                                shrink-0 relative rounded overflow-hidden flex items-center justify-center
                                transition-all duration-300 ease-out
                                ${showLightbox
                                    ? index === selectedIndex
                                        ? "opacity-100 blur-0 scale-100 z-10"
                                        : "opacity-15 blur-sm scale-95"
                                    : "opacity-100 blur-0"
                                }
                                `}
                            style={{
                                width: isMultipleItems ? "auto" : "100%",
                                height: "100%",
                                minWidth: "0",
                                pointerEvents: "auto",
                            }}
                            onClick={(e) => handleOpenMedia(e, index)}
                        >
                            {item.type === "youtube" ? (
                                <div
                                    className={`flex items-center justify-center ${isMultipleItems
                                        ? "h-full bg-transparent"
                                        : "w-full h-full bg-transparent"
                                        }`}
                                >
                                    <img
                                        src={`https://img.youtube.com/vi/${item.url.match(
                                            /(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
                                        )?.[1]
                                            }/mqdefault.jpg`}
                                        alt="YouTube thumbnail"
                                        className={`${isMultipleItems ? "h-full w-auto" : "w-auto max-h-full"
                                            } object-contain`}
                                        onLoad={(e) => handleImageLoad(e, index)}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-transparent group-hover:bg-black/50 transition">
                                        <Play size={32} className="text-white fill-white" />
                                    </div>
                                </div>
                            ) : item.type === "video" ? (
                                <>
                                    <video
                                        className={`${isMultipleItems ? "h-full w-auto" : "w-auto max-h-full"
                                            } object-contain`}
                                        src={item.url}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-transparent group-hover:bg-black/50 transition">
                                        <Play size={32} className="text-white fill-white" />
                                    </div>
                                </>
                            ) : (
                                <img
                                    src={item.url}
                                    alt={`Gallery item ${index + 1}`}
                                    className={`${isMultipleItems ? "h-full w-auto" : "w-auto max-h-full"
                                        } object-contain`}
                                    onLoad={(e) => handleImageLoad(e, index)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Indicators Dots - Chỉ hiển thị khi có nhiều items VÀ có overflow */}
            {isMultipleItems && hasOverflow && (
                <div className="flex justify-center gap-1.5 mt-2">
                    {sortedItems.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (scrollContainerRef.current) {
                                    const container = scrollContainerRef.current;
                                    const scrollWidth = container.scrollWidth;
                                    const containerWidth = container.offsetWidth;
                                    const maxScroll = scrollWidth - containerWidth;
                                    const targetScroll =
                                        (index / (sortedItems.length - 1)) * maxScroll;
                                    container.scrollLeft = targetScroll;
                                    setSelectedIndex(index);
                                }
                            }}
                            className={`h-1.5 rounded-full transition-all duration-200 ${index === selectedIndex
                                ? "bg-foreground w-6"
                                : "bg-text-secondary hover:bg-text-muted w-1.5"
                                }`}
                            aria-label={`Go to item ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {showLightbox && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua lightbox
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowLightbox(false);
                        }}
                        className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-50"
                    >
                        <X size={24} />
                    </button>
                    {/* Download */}
                    {currentItem.type !== "youtube" && (
                        <button
                            onClick={handleDownloadCurrentMedia}
                            className="absolute top-4 right-16 bg-black/70 text-white px-3 py-2 rounded-lg hover:bg-black transition z-50"
                        >
                            ⬇ Download
                        </button>
                    )}

                    {/* Prev */}
                    {sortedItems.length > 1 && (
                        <button
                            onClick={handlePrev}
                            className="absolute left-6 top-1/2 -translate-y-1/2
                                bg-black/60 text-white
                                w-14 h-14 text-4xl
                                flex items-center justify-center
                                rounded-full hover:bg-black transition z-50"
                        >
                            ‹
                        </button>
                    )}

                    {/* Next */}
                    {sortedItems.length > 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-6 top-1/2 -translate-y-1/2
                                bg-black/60 text-white
                                w-14 h-14 text-4xl
                                flex items-center justify-center
                                rounded-full hover:bg-black transition z-50"
                        >
                            ›
                        </button>
                    )}

                    {currentItem.type === "youtube" ? (
                        <div
                            className="relative w-full max-w-4xl bg-black"
                            style={{ paddingBottom: "56.25%" }}
                        >
                            <iframe
                                src={embedUrl!}
                                title={`YouTube video ${selectedIndex + 1}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full"
                            />
                        </div>
                    ) : currentItem.type === "image" ? (
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
        </div>
    );
};
