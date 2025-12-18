import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

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
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            // Optionally invalidate specific profile if we have username
        },
    });
};

export const useUnfollowUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.users.unfollow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
};