import { apiClient } from '@/lib/api-client';
import type { User, Author } from '@/types/user';
import type { Post, CreatePostData, CommentData } from '@/types/post';
import type { ProfileResponse } from '@/types/response';

export type { User, Author, Post, CreatePostData, CommentData, ProfileResponse };

export const api = {
    users: {
        getAll: () => apiClient.get<User[]>('/api/v1/users/') as unknown as Promise<User[]>,
        get: (id: string) => apiClient.get<User>(`/api/v1/users/${id}`) as unknown as Promise<User>,
        getMe: () => apiClient.get<User>('/api/v1/me') as unknown as Promise<User>,
        getProfile: (username: string) => apiClient.get<ProfileResponse>(`/api/v1/users/profile/${username}`) as unknown as Promise<ProfileResponse>,
        follow: (userId: string) => apiClient.post(`/api/v1/users/${userId}/follow`),
        unfollow: (userId: string) => apiClient.post(`/api/v1/users/${userId}/unfollow`),
    },
    posts: {
        getAll: () => apiClient.get<Post[]>('/api/v1/posts') as unknown as Promise<Post[]>,
        get: (post_id: string) => apiClient.get<Post>(`/api/v1/posts/${post_id}`) as unknown as Promise<Post>,
        create: (data: FormData) => apiClient.post<Post>('/api/v1/posts', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }) as unknown as Promise<Post>,

        // Interactions
        like: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/like`),
        share: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/share`),
        repost: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/repost`),
        save: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/save`),

        // Comments
        addComment: (post_id: string, data: FormData) => apiClient.post(`/api/v1/posts/${post_id}/comments`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        deleteComment: (post_id: string, comment_id: string) => apiClient.delete(`/api/v1/posts/${post_id}/comments/${comment_id}`),
    },
};

export const getPostDetail = async (postId: string) => {
    // Đường dẫn này tùy thuộc vào Backend của bạn
    const response = await apiClient.get(`/posts/${postId}`);
    return response.data;
};

export const getPostActivity = async (postId: string) => {
    const response = await apiClient.get(`/posts/${postId}/activity`);
    return response.data;
}