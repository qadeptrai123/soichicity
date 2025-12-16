// src/types/auth.ts
export interface User {
    uid: string;
    email: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    is_active: boolean;
    provider: string;
    created_at: string; // ISO string from backend
    followers_count: number;
    followings_count: number;
    blocks_count: number;
    reposts_count: number;
    saves_count: number;
    likes_count: number;
    notifications_count: number;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}
