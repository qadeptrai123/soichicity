import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from "sonner";


export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: api.users.getAll,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.users.get(id),
    enabled: !!id,
  });
};




export const useProfile = (username: string) => {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.users.getProfile(username),
    enabled: !!username,
  });
}

export const useFollowing = (userId: string, options?: { enabled?: boolean }) => {
  return useInfiniteQuery({
    queryKey: ['following', userId],
    queryFn: ({ pageParam = null }) => api.users.getFollowing(userId, 10, pageParam),
    getNextPageParam: (lastPage: any) => lastPage?.next_cursor ?? undefined,
    initialPageParam: null,
    enabled: options?.enabled ?? !!userId,
  });
};

export const useFollowers = (userId: string, options?: { enabled?: boolean }) => {
  return useInfiniteQuery({
    queryKey: ['followers', userId],
    queryFn: ({ pageParam = null }) => api.users.getFollowers(userId, 10, pageParam),
    getNextPageParam: (lastPage: any) => lastPage?.next_cursor ?? undefined,
    initialPageParam: null,
    enabled: options?.enabled ?? !!userId,
  });
};

export const useFollowingAndFollowers = (userId: string, options?: { enabled?: boolean }) => {
  const following = useFollowing(userId, options);
  const followers = useFollowers(userId, options);

  return {
    following,
    followers,
    allUsers: [
      ...(following.data?.pages.flatMap((page: any) => page.items) || []),
      ...(followers.data?.pages.flatMap((page: any) => page.items) || [])
    ].filter((user: any, index, self) =>
      // Remove duplicates based on uid
      index === self.findIndex((u) => u.uid === user.uid)
    ),
    isLoading: following.isLoading || followers.isLoading,
  };
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.follow,

    onSuccess: () => {
      toast.success("Followed user");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["post-activity"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Refresh feed to show new posts
    },

    onError: () => {
      toast.error("Failed to follow user");
    },
  });
};


export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.unfollow,

    onSuccess: () => {
      toast.success("Unfollowed user");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["post-activity"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Refresh feed to remove unmatched posts
    },

    onError: () => {
      toast.error("Failed to unfollow user");
    },
  });
};

export const useEditProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.updateProfile,

    onMutate: async () => {
      toast.loading("Updating profile...", { id: "edit-profile" });
    },

    onSuccess: (_data) => {
      toast.success("Profile updated successfully", {
        id: "edit-profile",
      });

      // invalidate để UI cập nhật
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },

    onError: () => {
      toast.error("Failed to update profile", {
        id: "edit-profile",
      });
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.block,

    onSuccess: () => {
      toast.success("Blocked user");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["post-activity"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] }); // force refetch feed
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-reposts"] });
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to block user");
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.users.unblock,

    onSuccess: () => {
      toast.success("Unblocked user");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-reposts"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["post-activity"] });
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to unblock user");
    },
  });
};

export const useBlockedUsers = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['blocked-users'],
    queryFn: api.users.getBlockedUsers,
    enabled: options?.enabled,
  });
};

// ... (previous imports)

export const useUserPosts = (userId: string, type: string = "posts", options?: { enabled?: boolean, initialData?: any, limit?: number }) => {
  return useInfiniteQuery({
    queryKey: ['user-posts', userId, type, options?.limit ?? 10],
    queryFn: ({ pageParam = null }) => api.users.getUserPosts(userId, options?.limit ?? 10, pageParam, type),
    getNextPageParam: (lastPage: any) => lastPage?.next_cursor ?? undefined,
    initialPageParam: null,
    enabled: options?.enabled ?? !!userId,
    initialData: options?.initialData,
  });
};

export const useUserReposts = (userId: string, options?: { enabled?: boolean }) => {
  return useInfiniteQuery({
    queryKey: ['user-reposts', userId],
    queryFn: ({ pageParam = null }) => api.users.getUserReposts(userId, 10, pageParam),
    getNextPageParam: (lastPage: any) => lastPage?.next_cursor ?? undefined,
    initialPageParam: null,
    enabled: options?.enabled ?? !!userId,
  });
};
