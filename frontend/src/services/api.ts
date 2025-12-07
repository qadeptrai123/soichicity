import { apiClient } from '@/lib/api-client';

export type User = {
    id: string;
    email: string;
    full_name?: string;
    username?: string;
    // Add other fields as needed
};

export type Thread = {
    id: string;
    content: string;
    author_id: string;
    created_at: string;
    // Add other fields as needed
};

export type CreateThreadData = {
    content: string;
};

export type CreateCommentData = {
    thread_id: string | number;  
    content: string;
    media?: { url: string; type: "image" | "video" }[];
};

export const api = {
    users: {
        getAll: () => apiClient.get<User[]>('/api/v1/users/'),
        get: (id: string) => apiClient.get<User>(`/api/v1/users/${id}`),
        getMe: () => apiClient.get<User>('/api/v1/me'),
    },
    threads: {
        getAll: () => apiClient.get<Thread[]>('/api/v1/threads/'),
        get: (id: string) => apiClient.get<Thread>(`/api/v1/threads/${id}`),
        create: (data: CreateThreadData) => apiClient.post<Thread>('/api/v1/threads/', data),
    },
    comments: {
        create: (data: CreateCommentData) =>
            apiClient.post('/api/v1/comments/', data),
    },
};


