import { apiClient } from "@/lib/api-client";

export interface SearchUser {
    objectID: string;
    username: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
}

export interface SearchPost {
    objectID: string;
    content: string;
    user_id: string;
    created_at: number; // Algolia likely returns timestamp
    image_urls: string[];
    reply_count: number;
    like_count: number;
}

export interface SearchResponse {
    users: {
        hits: SearchUser[];
        total: number;
        page: number;
        pages: number;
    };
    posts: {
        hits: SearchPost[];
        total: number;
        page: number;
        pages: number;
    };
}

export const searchService = {
    search: async (query: string): Promise<SearchResponse> => {
        return apiClient.get('/api/v1/search/', {
            params: { q: query }
        });
    }
};
