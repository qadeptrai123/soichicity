import { toast } from "sonner";

/**
 * ✅ Toast thành công
 * Dùng cho create / update / like / follow...
 */
export const showSuccess = (message?: string) => {
  toast.success(message || "Thao tác thành công");
};

/**
 * ❌ Toast lỗi
 * Dùng trong api-client interceptor
 */
export const showError = (message?: string) => {
  toast.error(message || "Có lỗi xảy ra");
};

/**
 * ℹ️ Toast trung tính (info)
 */
export const showInfo = (message: string) => {
  toast(message);
};

/**
 * ⏳ Toast loading (dùng cho promise)
 * Ví dụ: đăng bài, login
 */
export const showLoading = (message = "Đang xử lý...") => {
  return toast.loading(message);
};

/**
 * 🔁 Update toast (loading → success / error)
 */
export const updateToast = (
  toastId: string | number,
  type: "success" | "error",
  message: string
) => {
  toast[type](message, {
    id: toastId,
  });
};
