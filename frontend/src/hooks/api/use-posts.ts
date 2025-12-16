import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

// --- Queries ---
export const usePosts = () => {
  return useQuery({ queryKey: ["posts"], queryFn: api.posts.getAll });
};

// --- Mutations ---
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.like,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useSharePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.share,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useRepostPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.repost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.save,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: FormData }) =>
      api.posts.addComment(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useDeleteComment = () =>
  useMutation({
    mutationFn: ({
      postId,
      commentId,
    }: {
      postId: string;
      commentId: string;
    }) => api.posts.deleteComment(postId, commentId),
  });

// --- MOCK DATA FIX CHUẨN ---
const MOCK_THREAD_DATA = {
  post_id: "thread-main-1",
  content:
    "Cuối cùng cũng fix xong bug! Cảm giác thật yomost 🤣 Anh em nào đang code React thì giơ tay điểm danh nào!",
  created_at: new Date().toISOString(),

  // Author của bài viết chính
  author: {
    id: "u1",
    username: "dev_x",
    name: "Dev Tuyệt Vọng",
    avatar: "https://github.com/shadcn.png",
  },

  author_id: "u1",

  // Counts
  likes_count: 540,
  reposts_count: 0,
  saves_count: 0,
  comments_count: 12,

  // Interactions
  is_liked: false,
  is_saved: false,
  is_shared: false,
  is_reposted: false,

  activity: [
    { type: "like", user: { name: "Nam", avatar: "" } },
    { type: "repost", user: { name: "Huy", avatar: "" } },
  ],

  // Danh sách comment
  comments: {
    items: [
      {
        post_id: "reply-1",
        content: "Cố lên bác ơi, bug là tính năng mà :v",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        author_id: "u2",

        likes_count: 24,
        comments_count: 0,
        saves_count: 5,
        reposts_count: 1,
        media_url: null,
        // Author của comment 1
        author: {
          name: "Coder Qua Đường",
          handle: "@passerby",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        },
      },
      {
        post_id: "reply-2",
        content: "Xin vía fix bug nhanh gọn lẹ!",
        created_at: new Date(Date.now() - 7200000).toISOString(),
        author_id: "u3",

        likes_count: 10,
        comments_count: 0,
        saves_count: 0,
        reposts_count: 0,
        media_url: null,
        // Author của comment 2
        author: {
          name: "Newbie",
          handle: "@new_bie",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
        },
      },
    ],
    total: 2,
    page: 1,
    page_size: 10,
    total_pages: 1
  }
};

export const useThreadDetail = (threadId: string) => {
  return useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay tí cho giống thật
      return MOCK_THREAD_DATA;
    },
    enabled: !!threadId,
  });
};
