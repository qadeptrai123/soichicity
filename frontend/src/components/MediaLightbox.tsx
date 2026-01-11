import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { getYouTubeEmbedUrl } from "./Gallery"; // Reuse helper or move to utils
import { toast } from "sonner";


interface MediaLightboxProps {
    open: boolean;
    onClose: () => void;
    src: string;
    type: "image" | "video" | "youtube";
    onPrev?: () => void;
    onNext?: () => void;
    hasNavigation?: boolean; // If true, shows arrows if onPrev/onNext are provided
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
    open,
    onClose,
    src,
    type,
    onPrev,
    onNext,
    hasNavigation = false,
}) => {
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);

    useEffect(() => {
        if (type === "youtube") {
            setEmbedUrl(getYouTubeEmbedUrl(src));
        }
    }, [src, type]);

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!src) {
            toast.error("No media to download");
            return;
        }
        // Updated download logic to match existing pattern
        const downloadUrl = "http://localhost:8000/api/media/download?url=" + encodeURIComponent(src);
        window.location.href = downloadUrl;
    };

    // Handle keyboard navigation
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" && onPrev) onPrev();
            if (e.key === "ArrowRight" && onNext) onNext();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onPrev, onNext]);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            {/* 
        We use a custom DialogContent style to make it full screen and transparent background.
        We override the default styling completely for the lightbox experience.
      */}
            <DialogContent
                className="max-w-none w-screen h-screen p-0 m-0 border-none bg-black/95 flex items-center justify-center overflow-hidden focus:outline-none fixed top-0 left-0 translate-x-0 translate-y-0 rounded-none data-[state=open]:slide-in-from-bottom-0 sm:max-w-none"
                showCloseButton={false} // We implement our own
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">Media Lightbox</DialogTitle>
                <DialogDescription className="sr-only">Full screen media view</DialogDescription>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[60] text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X size={32} />
                </button>

                {/* Download Button (not for YouTube) */}
                {type !== "youtube" && (
                    <button
                        onClick={handleDownload}
                        className="absolute top-4 right-16 z-[60] text-white/70 hover:text-white px-4 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <Download size={24} />
                    </button>
                )}

                {/* Navigation - Prev */}
                {hasNavigation && onPrev && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-[60] text-white/50 hover:text-white w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={48} />
                    </button>
                )}

                {/* Navigation - Next */}
                {hasNavigation && onNext && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-[60] text-white/50 hover:text-white w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight size={48} />
                    </button>
                )}

                {/* Media Content */}
                <div
                    className="w-full h-full flex items-center justify-center p-4 md:p-12 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {type === "youtube" ? (
                        <div className="relative w-full max-w-5xl aspect-video bg-black shadow-2xl">
                            {embedUrl && (
                                <iframe
                                    src={embedUrl}
                                    title="YouTube video"
                                    className="absolute inset-0 w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            )}
                        </div>
                    ) : type === "video" ? (
                        <video
                            src={src}
                            controls
                            autoPlay
                            className="max-w-full max-h-full object-contain shadow-2xl"
                            onClick={(e) => e.stopPropagation()} // Allow clicking video controls
                        />
                    ) : (
                        <img
                            src={src}
                            alt="Full screen media"
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
