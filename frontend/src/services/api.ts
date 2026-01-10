import { apiClient } from '@/lib/api-client';
import type { User, Author } from '@/types/user';
import type { Post, PostDetail, CreatePostData, CommentData } from '@/types/post';
import type { ProfileResponse } from '@/types/response';

export type { User, Author, Post, PostDetail, CreatePostData, CommentData, ProfileResponse };

export const api = {
  users: {
    getAll: () => apiClient.get<User[]>('/api/v1/users/') as unknown as Promise<User[]>,
    get: (id: string) => apiClient.get<User>(`/api/v1/users/${id}`) as unknown as Promise<User>,
    getMe: () => apiClient.get<User>('/api/v1/me') as unknown as Promise<User>,
    getProfile: (username: string) => apiClient.get<ProfileResponse>(`/api/v1/users/profile/${username}`) as unknown as Promise<ProfileResponse>,
    follow: (userId: string) => apiClient.post(`/api/v1/users/${userId}/follow`),
    unfollow: (userId: string) => apiClient.post(`/api/v1/users/${userId}/unfollow`),
    getFollowing: (userId: string, limit: number = 10, cursor?: string | null) => apiClient.get<any>(`/api/v1/users/${userId}/following`, { params: { limit, cursor } }) as unknown as Promise<{ items: User[], next_cursor: string | null }>,
    getFollowers: (userId: string, limit: number = 10, cursor?: string | null) => apiClient.get<any>(`/api/v1/users/${userId}/followers`, { params: { limit, cursor } }) as unknown as Promise<{ items: User[], next_cursor: string | null }>,
    updateProfile: (data: { full_name?: string; bio?: string; avatar_url?: string }) => 
      apiClient.put('/api/v1/users/me', data) as unknown as Promise<User>,
  },
  posts: {
    getAll: (filter?: string, cursor?: string) => apiClient.get<Post[]>('/api/v1/posts', { params: { filter, cursor } }) as unknown as Promise<Post[]>,
    get: (post_id: string) => apiClient.get<PostDetail>(`/api/v1/posts/${post_id}`) as unknown as Promise<PostDetail>,
    create: (data: FormData) => apiClient.post<Post>('/api/v1/posts', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }) as unknown as Promise<Post>,

    // Interactions
    like: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/like`),
    share: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/share`),
    repost: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/repost`),
    save: (post_id: string) => apiClient.post(`/api/v1/posts/${post_id}/save`),

    // Comments (Replies)
    getReplies: (post_id: string) => apiClient.get<Post[]>(`/api/v1/posts/${post_id}/replies`) as unknown as Promise<Post[]>,

    // Activity (Likes/Reposts Detail)
    getActivity: (post_id: string) => apiClient.get<any>(`/api/v1/posts/${post_id}/activity`) as unknown as Promise<{ likes: any[], reposts: any[] }>,


    // Interactions
    addComment: (post_id: string, data: FormData) => apiClient.post(`/api/v1/posts/${post_id}/comments`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteComment: (post_id: string, comment_id: string) => apiClient.delete(`/api/v1/posts/${post_id}/comments/${comment_id}`),
  },
  search: (params: { q: string, type: string, page?: number, limit?: number }) => apiClient.get('/api/v1/search', { params }),
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

export async function downloadMedia(mediaUrl: string) {
  const apiBase = import.meta.env.VITE_API_URL;

  const res = await fetch(
    `${apiBase}/media/download?url=${encodeURIComponent(mediaUrl)}`,
    {
      method: "GET",
      credentials: "include", // nếu sau này cần auth cookie
    }
  );

  if (!res.ok) {
    throw new Error("Download failed");
  }

  const blob = await res.blob();

  // lấy filename từ header backend
  const disposition = res.headers.get("content-disposition");
  let filename = "media";

  if (disposition) {
    const match = disposition.match(/filename="(.+)"/);
    if (match?.[1]) filename = match[1];
  }

  const blobUrl = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
