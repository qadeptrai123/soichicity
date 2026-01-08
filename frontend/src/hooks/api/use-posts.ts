import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { toast } from "sonner";

// --- Queries ---
import { useInfiniteQuery } from "@tanstack/react-query";


type ToggleSavePayload = {
  postId: string;
  wasSaved: boolean;
};

type ToggleRepostPayload = {
  postId: string;
  wasReposted: boolean;
};

export const usePosts = (filter: string = "all") => {
  return useInfiniteQuery({
    queryKey: ["posts", filter],
    queryFn: ({ pageParam = undefined }) => api.posts.getAll(filter, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      const lastPost = lastPage[lastPage.length - 1];
      return lastPost.created_at; // Use created_at as cursor
    }
  });
};

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

// ====================
// MUTATIONS
// ====================

// ✅ CREATE POST
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.posts.create,

    onSuccess: () => {
      toast.success("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },

    onError: () => {
      toast.error("Failed to create post");
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.posts.like,

    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

// ✅ SHARE POST
export const useSharePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.posts.share,

    onSuccess: (_data, postId) => {
      toast.success("Post shared");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },

    onError: () => {
      toast.error("Failed to share post");
    },
  });
};

// ✅ REPOST
export const useRepostPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: ToggleRepostPayload) =>
      api.posts.repost(postId),

    onSuccess: (_data, variables) => {
      toast.success(
        variables.wasReposted
          ? "Removed from reposted posts"
          : "Reposted"
      );

      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },

    onError: () => {
      toast.error("Failed to repost");
    },
  });
};


export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: ToggleSavePayload) =>
      api.posts.save(postId),

    onSuccess: (_data, variables) => {
      toast.success(
        variables.wasSaved
          ? "Removed from saved posts"
          : "Post saved"
      );

      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },

    onError: () => {
      toast.error("Failed to save post");
    },
  });
};

// ✅ ADD COMMENT
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: FormData }) =>
      api.posts.addComment(postId, data),

    onSuccess: (_data, variables) => {
      toast.success("Comment posted");
      queryClient.invalidateQueries({ queryKey: ["post-replies", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },

    onError: () => {
      toast.error("Failed to post comment");
    },
  });
};

// ✅ DELETE COMMENT
export const useDeleteComment = () =>
  useMutation({
    mutationFn: ({
      postId,
      commentId,
    }: {
      postId: string;
      commentId: string;
    }) => api.posts.deleteComment(postId, commentId),

    onSuccess: () => {
      toast.success("Comment deleted");
    },

    onError: () => {
      toast.error("Failed to delete comment");
    },
  });
