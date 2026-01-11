import React, { useState } from 'react';
import { Play } from "lucide-react";
import { isYouTubeUrl } from './Gallery';
import type { Post } from '@/types/post';
import { MediaLightbox } from "./MediaLightbox";

interface ProfileMediaTabProps {
    posts: Post[];
}

interface MediaItem {
    url: string;
    type: 'image' | 'video' | 'youtube';
    postId: string;
}

export const ProfileMediaTab: React.FC<ProfileMediaTabProps> = ({ posts }) => {
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

    const handleOpenLightbox = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setLightboxIndex(index);
    };






    if (mediaItems.length === 0) {
        return (
            <div className="py-12 text-center text-neutral-500">
                No media yet.
            </div>
        );
    }

    const activeItem = lightboxIndex !== null ? mediaItems[lightboxIndex] : null;

    return (
        <>
            <div className="grid grid-cols-4 gap-1 md:gap-2">
                {mediaItems.map((item, index) => (
                    <div
                        key={`${item.postId}-${index}`}
                        className="aspect-square relative group cursor-pointer overflow-hidden bg-neutral-900"
                        onClick={(e) => handleOpenLightbox(e, index)}
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
            {/* Lightbox */}
            {activeItem && (
                <MediaLightbox
                    open={lightboxIndex !== null}
                    onClose={() => setLightboxIndex(null)}
                    src={activeItem.url}
                    type={activeItem.type}
                    onPrev={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : mediaItems.length - 1))}
                    onNext={() => setLightboxIndex((prev) => (prev !== null && prev < mediaItems.length - 1 ? prev + 1 : 0))}
                    hasNavigation={mediaItems.length > 1}
                />
            )}
        </>
    );
};
