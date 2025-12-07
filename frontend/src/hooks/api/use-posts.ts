import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';


// --- Queries ---

export const usePosts = () => {
    return useQuery({
        queryKey: ['posts'],
        queryFn: api.posts.getAll,
    });
};

// 7 GAO LÀM CHỖ NÀY
// export const usePost = (postId: string) => {
//     return useQuery({
//         queryKey: ['posts', postId],
//         queryFn: () => api.posts.get(postId),
//         enabled: !!postId,
//     });
// };

// --- Mutations ---

export const useCreatePost = () => {
    // const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.posts.create,
        // onSuccess: () => {
        //     queryClient.invalidateQueries({ queryKey: ['posts'] });
        // },
    });
};

// Interactions

export const useLikePost = () => {
    // const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.posts.like,
        // onSuccess: (_, variables) => {
        //     // Invalidate specific post and feed
        //     queryClient.invalidateQueries({ queryKey: ['posts'] });
        //     queryClient.invalidateQueries({ queryKey: ['posts', variables] });
        // },
    });
};

// export const useUnlikePost = () => {
//     const queryClient = useQueryClient();
//     return useMutation({
//         mutationFn: api.posts.unlike,
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['posts'] });
//         }
//     });
// };

// Wait, I should implement the full file properly.
// Use 'any' to bypass TS for now if I can't touch api.ts in the same step?
// No, I can touch api.ts.

export const useSharePost = () => {
    // const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.posts.share,
        // onSuccess: () => {
        //     queryClient.invalidateQueries({ queryKey: ['posts'] });
        // },
    });
};

// export const useUnsharePost = () => {
//     const queryClient = useQueryClient();
//     return useMutation({
//         mutationFn: api.posts.unshare,
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['posts'] });
//         },
//     });
// };

export const useSavePost = () => {
    // const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.posts.save,
        // onSuccess: () => {
        //     queryClient.invalidateQueries({ queryKey: ['posts'] });
        // },
    });
};

// export const useUnsavePost = () => {
//     const queryClient = useQueryClient();
//     return useMutation({
//         mutationFn: api.posts.unsave,
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['posts'] });
//         },
//     });
// };

// Comments

export const useAddComment = () => {
    // const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ postId, data }: { postId: string; data: FormData }) =>
            api.posts.addComment(postId, data),
        // onSuccess: (_, variables) => {
        //     queryClient.invalidateQueries({ queryKey: ['posts'] });
        //     queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
        // },
    });
};

export const useDeleteComment = () => {
    // const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
            api.posts.deleteComment(postId, commentId),
        // onSuccess: (_, variables) => {
        //     queryClient.invalidateQueries({ queryKey: ['posts'] });
        //     queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
        // },
    });
};
