import { apiClient } from "@/lib/api-client";

export const mediaApi = {
  download: (postId: string) =>
    apiClient.get(`/media/${postId}/download`, {
      responseType: "blob", // ⚠️ BẮT BUỘC
    }),
};
