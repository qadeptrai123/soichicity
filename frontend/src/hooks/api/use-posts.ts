import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';


// --- Queries ---
export const usePosts = () => {
    return useQuery({ queryKey: ['posts'], queryFn: api.posts.getAll });
};

// --- Mutations ---
export const useCreatePost = () => useMutation({ mutationFn: api.posts.create });
export const useLikePost = () => useMutation({ mutationFn: api.posts.like });
export const useSharePost = () => useMutation({ mutationFn: api.posts.share });
export const useSavePost = () => useMutation({ mutationFn: api.posts.save });
export const useAddComment = () => useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: FormData }) => api.posts.addComment(postId, data),
});
export const useDeleteComment = () => useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) => api.posts.deleteComment(postId, commentId),
});

// --- MOCK DATA FIX CHUẨN ---
const MOCK_THREAD_DATA = {
    id: "thread-main-1",
    content: "Cuối cùng cũng fix xong bug! Cảm giác thật yomost 🤣 Anh em nào đang code React thì giơ tay điểm danh nào!",
    createdAt: new Date().toISOString(),
    
    // Author của bài viết chính
    author: {
        id: "u1",
        username: "dev_x",
        name: "Dev Tuyệt Vọng",
        avatar: "https://github.com/shadcn.png"
    },
    
    likes: 540, 
    // LƯU Ý: Đã xóa dòng "replies: 12" gây lỗi duplicate ở đây
    
    activity: [
        { type: 'like', user: { name: 'Nam', avatar: '' } },
        { type: 'repost', user: { name: 'Huy', avatar: '' } }
    ],

    // Danh sách comment
    replies: [
        {
            id: "reply-1",
            content: "Cố lên bác ơi, bug là tính năng mà :v",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            author_id: "u2",
            actions_count: 24,
            replies_count: 0,
            bookmark_count: 5,
            shares_count: 1,
            media_url: null,
            // Author của comment 1
            author: {
                name: "Coder Qua Đường",
                handle: "@passerby",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            }
        },
        {
            id: "reply-2",
            content: "Xin vía fix bug nhanh gọn lẹ!",
            created_at: new Date(Date.now() - 7200000).toISOString(),
            author_id: "u3",
            actions_count: 10,
            replies_count: 0,
            bookmark_count: 0,
            shares_count: 0,
            media_url: null,
            // Author của comment 2
            author: {
                name: "Newbie",
                handle: "@new_bie",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
            }
        }
    ]
};

export const useThreadDetail = (threadId: string) => {
  return useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay tí cho giống thật
        return MOCK_THREAD_DATA;
    },
    enabled: !!threadId,
  });
};