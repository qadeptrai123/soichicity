import React, { useState } from 'react';
import { Play, X, Download } from "lucide-react";
import { getYouTubeEmbedUrl, isYouTubeUrl } from './Gallery';
import type { Post } from '@/types/post';
import { toast } from "sonner";

interface ProfileMediaTabProps {
    posts: Post[];
    isLoading?: boolean;
}

interface MediaItem {
    url: string;
    type: 'image' | 'video' | 'youtube';
    postId: string;
}

export const ProfileMediaTab: React.FC<ProfileMediaTabProps> = ({ posts, isLoading }) => {
    // Extract and flatten all media from posts
    const mediaItems: MediaItem[] = React.useMemo(() => {
        const items: MediaItem[] = [];
        posts.forEach(post => {
            if (post.media_urls && post.media_urls.length > 0) {
                post.media_urls.forEach(url => {
                    let type: 'image' | 'video' | 'youtube' = 'image';
                    if (isYouTubeUrl(url)) {
                        type = 'youtube';
                    } else if (/\.(mp4|webm|ogg)$/i.test(url)) {
                        type = 'video';
                    }
                    items.push({
                        url,
                        type,
                        postId: post.post_id
                    });
                });
            }
        });
        return items;
    }, [posts]);

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const handleOpenLightbox = (index: number) => {
        setLightboxIndex(index);
    };

    const handleCloseLightbox = () => {
        setLightboxIndex(null);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev !== null && prev < mediaItems.length - 1 ? prev + 1 : 0));
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : mediaItems.length - 1));
        }
    };

    const handleDownload = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        if (!url) {
            toast.error("No media to download");
            return;
        }

        const downloadUrl =
            import.meta.env.VITE_API_URL + "/media/download?url=" +
            encodeURIComponent(url);

        window.location.href = downloadUrl;
    };

    // Keyboard navigation for lightbox
    React.useEffect(() => {
        if (lightboxIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") {
                setLightboxIndex((prev) => (prev !== null && prev < mediaItems.length - 1 ? prev + 1 : 0));
            } else if (e.key === "ArrowLeft") {
                setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : mediaItems.length - 1));
            } else if (e.key === "Escape") {
                setLightboxIndex(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, mediaItems.length]);


    if (isLoading) {
        return (
            <div className="grid grid-cols-4 gap-1 md:gap-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square bg-neutral-800 animate-pulse rounded-md" />
                ))}
            </div>
        )
    }

    if (mediaItems.length === 0) {
        return (
            <div className="py-12 text-center text-neutral-500">
                No media yet.
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-4 gap-1 md:gap-2">
                {mediaItems.map((item, index) => (
                    <div
                        key={`${item.postId}-${index}`}
                        className="aspect-square relative group cursor-pointer overflow-hidden bg-neutral-900"
                        onClick={() => handleOpenLightbox(index)}
                    >
                        {item.type === 'youtube' ? (
                            <div className="w-full h-full flex items-center justify-center relative">
                                <img
                                    src={`https://img.youtube.com/vi/${item.url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]}/mqdefault.jpg`}
                                    alt="YouTube Thumbnail"
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                        <Play size={20} className="text-white fill-white ml-1" />
                                    </div>
                                </div>
                            </div>
                        ) : item.type === 'video' ? (
                            <div className="w-full h-full relative">
                                <video
                                    src={item.url}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                    <Play size={16} className="text-white drop-shadow-md fill-white" />
                                </div>
                            </div>
                        ) : (
                            <img
                                src={item.url}
                                alt="Gallery item"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-200"
                    onClick={handleCloseLightbox}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        onClick={handleCloseLightbox}
                    >
                        <X size={32} />
                    </button>

                    {mediaItems[lightboxIndex].type !== 'youtube' && (
                        <button
                            className="absolute top-4 right-20 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            onClick={(e) => handleDownload(e, mediaItems[lightboxIndex].url)}
                            title="Download"
                        >
                            <Download size={28} />
                        </button>
                    )}

                    <div
                        className="w-full max-w-7xl max-h-screen p-4 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {mediaItems[lightboxIndex].type === 'youtube' ? (
                            <div className="aspect-video w-full max-w-5xl bg-black rounded-lg overflow-hidden shadow-2xl">
                                <iframe
                                    src={getYouTubeEmbedUrl(mediaItems[lightboxIndex].url) + "?autoplay=1"}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : mediaItems[lightboxIndex].type === 'video' ? (
                            <video
                                src={mediaItems[lightboxIndex].url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                            />
                        ) : (
                            <img
                                src={mediaItems[lightboxIndex].url}
                                alt="Full size"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            />
                        )}
                    </div>

                    {mediaItems.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                onClick={handlePrev}
                            >
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                onClick={handleNext}
                            >
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    );
};
