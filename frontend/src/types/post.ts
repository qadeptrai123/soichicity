import type { Author } from './user';
export type { Author };
import type { MediaItem } from './common';

export interface Post {
    post_id: string;
    content: string;
    created_at: string;
    author_id: string;
    author?: Author;

    // Media
    media_urls?: string[];
    media_url?: string | null;
    media_type?: "image" | "video" | "youtube" | string | null;
    gallery?: MediaItem[];

    // Hierarchy
    level?: number;
    reply_to_id?: string;
    root_id?: string;
    replies?: Post[];

    // Counts
    likes_count?: number; // Optional because FeedCard PostData used optional
    reposts_count?: number;
    saves_count?: number;
    comments_count?: number;
    shares_count?: number;

    // Status
    is_liked?: boolean;
    is_repost?: boolean;
    is_saved?: boolean;
    is_shared?: boolean;
}

// Alias for FeedCard compatibility if needed, or we just refactor FeedCard to use Post
export type PostData = Post;
export type AuthorData = Author;

export type CreatePostData = {
    content: string;
    files?: File[];
};

export type CommentData = {
    content: string;
    files?: File[];
};
