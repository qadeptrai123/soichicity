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
      return lastPost.interaction_at || lastPost.created_at; // Use interaction_at if available, else created_at
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

export const usePostActivity = (postId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ["post-activity", postId],
    queryFn: () => api.posts.getActivity(postId),
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
    mutationFn: (data: any) => {
      const promise = api.posts.create(data);
      toast.promise(promise, {
        loading: 'Uploading post...',
        success: 'Post created successfully',
        error: 'Failed to create post',
      });
      return promise;
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // If it's a reply, use robust invalidation strategy to handle eventual consistency
      if (data.reply_to_id) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["post-replies"] });
          queryClient.invalidateQueries({ queryKey: ["post", data.reply_to_id] });
        }, 500);
      }
    },
  });
};

// ✅ EDIT POST
export const useEditPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: FormData }) => {
      const promise = api.posts.update(postId, data);
      toast.promise(promise, {
        loading: 'Updating post...',
        success: 'Post updated successfully',
        error: 'Failed to update post',
      });
      return promise;
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", data.post_id] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};


// Helper to update cache
const updatePostCache = (queryClient: any, postId: string, updater: (post: any) => any) => {
  // 1. Update Infinite Query Cache (Feed & User Posts & Reposts)
  ["posts", "user-posts", "user-reposts"].forEach((key) => {
    queryClient.setQueriesData({ queryKey: [key] }, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => {
          // Handle Main Feed (Array)
          if (Array.isArray(page)) {
             return page.map((post: any) =>
                post.post_id === postId ? updater(post) : post
             );
          }
          // Handle User/Profile Feed (Object with items)
          if (page?.items && Array.isArray(page.items)) {
             return {
                 ...page,
                 items: page.items.map((post: any) => 
                    post.post_id === postId ? updater(post) : post
                 )
             };
          }
          return page;
        }),
      };
    });
  });

  // 2. Update Detail Query Cache
  queryClient.setQueryData(["post", postId], (oldPost: any) => {
    if (!oldPost) return oldPost;
    return updater(oldPost);
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.posts.like,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPosts = queryClient.getQueryData(["posts"]);
      const previousPost = queryClient.getQueryData(["post", postId]);

      updatePostCache(queryClient, postId, (post) => {
        const isLiked = !post.is_liked;
        return {
          ...post,
          is_liked: isLiked,
          likes_count: (post.likes_count || 0) + (isLiked ? 1 : -1),
        };
      });

      return { previousPosts, previousPost };
    },
    onError: (err: any, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
      const msg = err.response?.data?.detail || "Failed to like post";
      toast.error(msg);
    },
    onSettled: (_data, _error, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-reposts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useSharePost = () => {
  // Keep as is for now or implement similar if needed
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.posts.share,

    onSuccess: (_data, postId) => {
      toast.success("Post shared");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },

    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Failed to share post";
      toast.error(msg);
    },
  });
};

export const useRepostPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: ToggleRepostPayload) =>
      api.posts.repost(postId),

    onMutate: async ({ postId, wasReposted: _wasReposted }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPosts = queryClient.getQueryData(["posts"]);
      const previousPost = queryClient.getQueryData(["post", postId]);

      updatePostCache(queryClient, postId, (post) => {
        const isReposted = !post.is_reposted;
        // If we rely on passed 'wasReposted', we assume it's correct. 
        // Ideally we toggle based on current cache state to be safe? 
        // But UI passes 'wasReposted'. Let's trust cache toggle for consistency.
        return {
          ...post,
          is_reposted: isReposted,
          reposts_count: (post.reposts_count || 0) + (isReposted ? 1 : -1),
        };
      });

      return { previousPosts, previousPost };
    },

    onError: (err: any, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      if (context?.previousPost) {
        queryClient.setQueryData(["post", variables.postId], context.previousPost);
      }
      const msg = err.response?.data?.detail || "Failed to repost";
      toast.error(msg);
    },

    onSuccess: (_data, variables) => {
         toast.success(
            variables.wasReposted
              ? "Removed from reposts"
              : "Reposted"
          );
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-reposts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};


export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: ToggleSavePayload) =>
      api.posts.save(postId),

    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPosts = queryClient.getQueryData(["posts"]);
      const previousPost = queryClient.getQueryData(["post", postId]);

      updatePostCache(queryClient, postId, (post) => {
        const isSaved = !post.is_saved;
        return {
          ...post,
          is_saved: isSaved,
          saves_count: (post.saves_count || 0) + (isSaved ? 1 : -1),
        };
      });

      return { previousPosts, previousPost };
    },

    onError: (err: any, variables, context) => {
      if (context?.previousPosts) queryClient.setQueryData(["posts"], context.previousPosts);
      if (context?.previousPost) queryClient.setQueryData(["post", variables.postId], context.previousPost);
      
      const msg = err.response?.data?.detail || "Failed to save post";
      toast.error(msg);
    },

    onSuccess: (_data, variables) => {
      toast.success(
        variables.wasSaved
          ? "Removed from saved posts"
          : "Post saved"
      );
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-reposts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

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
