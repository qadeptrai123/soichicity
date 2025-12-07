import { useMutation } from "@tanstack/react-query";
import { api, type CreateCommentData } from "@/services/api";

export const useCreateComment = () => {
  return useMutation({
    mutationFn: (data: CreateCommentData) => api.comments.create(data),
  });
};
