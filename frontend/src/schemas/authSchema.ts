import { z } from "zod";

// Schema cho Đăng nhập
export const loginSchema = z.object({
    identifier: z.string()
        .refine(
            (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                // Nếu là email thì không kiểm tra min, nếu là username thì min 2
                return emailRegex.test(value) || value.length >= 2;
            },
            { message: "Invalid email or username (username min 2 characters)" }
        ),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});


// Schema cho Đăng ký
export const registerSchema = z.object({
    username: z.string().min(2, { message: "Display name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid Email" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Confirm password does not match",
    path: ["confirmPassword"],
});

// Schema cho Quên mật khẩu
export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid Email" }),
});

// Schema cho Đặt lại mật khẩu
export const resetPasswordSchema = z.object({
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(50, "Password cannot exceed 50 characters"),
    confirmPassword: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(50, "Password cannot exceed 50 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Gắn lỗi vào trường confirmPassword
});



// Export kiểu dữ liệu để dùng trong component
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
