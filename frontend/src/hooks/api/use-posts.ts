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
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["post-replies"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.like,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Invalidate specific post
      queryClient.invalidateQueries({ queryKey: ["post", variables] });
      // Invalidate replies if this post is a reply (we don't know easily, so maybe keep existing or try to guess? 
      // Actually invalidating "post-replies" globally is safe but overkill. 
      // For now let's just fix the "post" key to be specific as requested/discussed.
      queryClient.invalidateQueries({ queryKey: ["post-replies"] });
    },
  });
};

export const useSharePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.share,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Invalidate specific post
      queryClient.invalidateQueries({ queryKey: ["post", variables] });
      // Invalidate replies if this post is a reply (we don't know easily, so maybe keep existing or try to guess? 
      // Actually invalidating "post-replies" globally is safe but overkill. 
      // For now let's just fix the "post" key to be specific as requested/discussed.
      queryClient.invalidateQueries({ queryKey: ["post-replies"] });
    },
  });
};

export const useRepostPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.repost,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Invalidate specific post
      queryClient.invalidateQueries({ queryKey: ["post", variables] });
      // Invalidate replies if this post is a reply (we don't know easily, so maybe keep existing or try to guess? 
      // Actually invalidating "post-replies" globally is safe but overkill. 
      // For now let's just fix the "post" key to be specific as requested/discussed.
      queryClient.invalidateQueries({ queryKey: ["post-replies"] });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.posts.save,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Invalidate specific post
      queryClient.invalidateQueries({ queryKey: ["post", variables] });
      // Invalidate replies if this post is a reply (we don't know easily, so maybe keep existing or try to guess? 
      // Actually invalidating "post-replies" globally is safe but overkill. 
      // For now let's just fix the "post" key to be specific as requested/discussed.
      queryClient.invalidateQueries({ queryKey: ["post-replies"] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: FormData }) =>
      api.posts.addComment(postId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["post-replies", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
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

export const usePostDetail = (postId: string) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => api.posts.get(postId),
    enabled: !!postId,
  });
};

export const usePostReplies = (postId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ["post-replies", postId],
    queryFn: () => api.posts.getReplies(postId),
    enabled: !!postId && enabled,
  });
};
