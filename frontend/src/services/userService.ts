import { apiClient } from "@/lib/api-client";

export interface UserUpdateData {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    link?: string;
}

export const userService = {
    updateProfile: async (data: UserUpdateData) => {
        // The endpoint is /api/v1/users/me or just /users/me depending on apiClient config.
        // users.py has router @router.put("/users/me") and it's likely included in v1.
        // api.ts uses /api/v1/ prefix.
        const response = await apiClient.put("/api/v1/users/me", data);
        return response.data;
    },

    getProfile: async (username: string) => {
        const response = await apiClient.get(`/api/v1/users/profile/${username}`);
        return response.data;
    },

    getFollowers: async (userId: string, limit: number = 10, cursor?: string | null) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cursor) params.append("cursor", cursor);
        
        const response = await apiClient.get(`/api/v1/users/${userId}/followers?${params.toString()}`);
        return response.data;
    },

    getFollowing: async (userId: string, limit: number = 10, cursor?: string | null) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cursor) params.append("cursor", cursor);

        const response = await apiClient.get(`/api/v1/users/${userId}/following?${params.toString()}`);
        return response.data;
    }
};
