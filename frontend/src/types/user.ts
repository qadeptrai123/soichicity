export interface User {
    uid: string;
    username: string;
    email?: string;
    full_name?: string;
    name?: string; // Legacy/Compat
    id?: string | number; // Legacy/Compat
    handle?: string; // Legacy/Compat
    avatar_url?: string;
    avatar?: string; // Legacy/Compat
    bio?: string;
    link?: string;
    created_at?: string;
    is_active?: boolean;
    provider?: string;

    // Stats
    followers_count?: number;
    followings_count?: number;
    blocks_count?: number;
    reposts_count?: number;
    saves_count?: number;
    likes_count?: number;
    notifications_count?: number;

    // Interaction status
    is_following?: boolean;
    is_self?: boolean;
}

export type Author = User;


