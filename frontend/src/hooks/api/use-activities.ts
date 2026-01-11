import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export const useActivities = (filter: string = "all") => {
    return useInfiniteQuery({
        queryKey: ["activities", filter], // Use "activities" key to distinguish from "notifications" if needed, or stick to "notifications"
        queryFn: ({ pageParam = null }) => api.users.getNotifications(20, pageParam as string | null, filter),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage: any) => (lastPage && lastPage.next_cursor) ? lastPage.next_cursor : undefined,
    });
};

export const useUnreadNotifications = (enabled: boolean = true) => {
    return useQuery({
        enabled,
        queryKey: ["unread-notifications"],
        queryFn: api.users.getUnreadCount,
        refetchInterval: 5000, // Poll every 5 seconds
        retry: 1, // Only retry once on failure to avoid loops
        staleTime: 4000, // Consider data fresh for 4 seconds
    });
};

export const useMarkNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.users.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["activities"] });
        },
    });
};
