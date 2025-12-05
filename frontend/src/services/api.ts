import { apiClient } from '@/lib/api-client';

export type Author = {
    id: string;
    username: string;
    name?: string;
    avatar_url?: string;
};

export type User = {
    id: string;
    email: string;
    full_name?: string;
    username?: string;
    // Add other fields as needed
};

export type Post = {
    id: string;
    content: string;
    link_url: string[];
    created_at: string;
    author_id: string;
    author?: Author;

    // Counts
    likeCount: number;
    shareCount: number;
    saveCount: number;
    commentCount: number;

    // Interaction status
    is_liked: boolean;
    is_shared: boolean;
    is_saved: boolean;
};

export type CreatePostData = {
    content: string;
    files?: File[];
};

export type CommentData = {
    content: string;
    files?: File[];
};

export const api = {
    users: {
        getAll: () => apiClient.get<User[]>('/api/v1/users/'),
        get: (id: string) => apiClient.get<User>(`/api/v1/users/${id}`),
        getMe: () => apiClient.get<User>('/api/v1/me'),
    },
    posts: {
        getAll: () => apiClient.get<Post[]>('/api/v1/posts'),
        get: (post_id: string) => apiClient.get<Post>(`/api/v1/posts/${post_id}`),
        create: (data: FormData) => apiClient.post<Post>('/api/v1/posts', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

        // Interactions
        like: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/like`),
        share: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/share`),
        save: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/save`),

        // Comments
        addComment: (post_id: string, data: FormData) => apiClient.post(`/api/v1/posts/${post_id}/comments`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        deleteComment: (post_id: string, comment_id: string) => apiClient.delete(`/api/v1/posts/${post_id}/comments/${comment_id}`),
    },
};
