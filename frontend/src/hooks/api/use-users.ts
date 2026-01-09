import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
