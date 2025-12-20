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
    gallery?: string[];

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
    is_reposted?: boolean;
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

// --- Values related to Post Detail API ---

export interface InteractionStatus {
    is_liked: boolean;
    is_reposted: boolean;
    is_saved: boolean;
}

export interface ActivityUser {
    name: string;
    username: string;
    avatar_url: string;
}

export interface ActivityItem {
    type: "like" | "repost" | string;
    user: ActivityUser;
}

export interface PostDetail extends Post {
    likes: number; // explicit flat field from API
    replies: Post[]; // Overwrite optional to required if guaranteed? Or keep compatible
    activity: ActivityItem[];
    current_user_interaction: InteractionStatus;
}
