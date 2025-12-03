import { useQuery } from '@tanstack/react-query';
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

export const useMe = () => {
    return useQuery({
        queryKey: ['me'],
        queryFn: api.users.getMe,
    });
};
