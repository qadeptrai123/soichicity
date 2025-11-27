import { z } from "zod";

// Schema cho Đăng nhập
export const loginSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

// Schema cho Đăng ký
export const registerSchema = z.object({
    username: z.string().min(2, { message: "Tên hiển thị phải có ít nhất 2 ký tự" }),
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

// Schema cho Quên mật khẩu
export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
});

// Export kiểu dữ liệu để dùng trong component
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;