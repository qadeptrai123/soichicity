import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateThreadData } from '@/services/api';

export const useThreads = () => {
    return useQuery({
        queryKey: ['threads'],
        queryFn: api.threads.getAll,
    });
};

export const useThread = (id: string) => {
    return useQuery({
        queryKey: ['threads', id],
        queryFn: () => api.threads.get(id),
        enabled: !!id,
    });
};

export const useCreateThread = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateThreadData) => api.threads.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['threads'] });
        },
    });
};
