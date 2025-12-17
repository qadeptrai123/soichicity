import { apiClient } from '@/lib/api-client';

export type Author = {
    uid: string;
    username: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
    avatar?: string;
};

export type User = {
    uid: string;
    email: string;
    full_name?: string;
    username?: string;
    // Add other fields as needed
    followers_count?: number;
    followings_count?: number;
    is_following?: boolean;
    is_self?: boolean;
    bio?: string;
    avatar_url?: string;
};

export type ProfileResponse = {
    user: User;
    posts: Post[];
    posts_count: number;
};

export type Post = {
    post_id: string;
    content: string;
    media_urls: string[];
    created_at: string;
    author_id: string;
    level: number;
    reply_to_id?: string;
    root_id?: string;

    author?: Author;

    // Counts
    likes_count: number;
    reposts_count: number;
    saves_count: number;
    comments_count: number;

    // Interaction status
    is_liked: boolean;
    is_shared: boolean; // Kept for legacy or strict check
    is_repost: boolean; // Backend returns is_repost
    is_saved: boolean;
    replies?: any[]; // For PostDetail
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