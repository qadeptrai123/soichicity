// File: src/components/auth/RegisterForm.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";

// Shadcn Components (Giả định path đúng)
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Schemas (Giả định path đúng)
import { registerSchema, type RegisterValues } from "@/schemas/authSchema";

// Định nghĩa props nếu bạn cần truyền state/hàm từ component cha
interface RegisterFormProps {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export function RegisterForm({ isLoading, setIsLoading }: RegisterFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- FORM ĐĂNG KÝ ---
    const registerForm = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
    });

    const onRegisterSubmit = async (data: RegisterValues) => {
        setIsLoading(true);
        // Giả lập gọi API
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("Register Data:", data);
        setIsLoading(false);
        // After successful registration, you may reset the form if needed:
        // registerForm.reset(); 
    };

    return (
        <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">

                {/* Username Field */}
                <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-medium text-slate-300">Username</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Choose a username"
                                    className="bg-[var(--bg-input)] border-slate-700 focus:border-blue-500/50 text-white placeholder:text-slate-400"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {/* Email Field */}
                <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-medium text-slate-300">Email</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    // Thay thế màu cứng
                                    className="bg-[var(--bg-input)] border-slate-700 focus:border-blue-500/50 text-white placeholder:text-slate-400"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {/* Password Field */}
                <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-medium text-slate-300">Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        // Thay thế màu cứng
                                        className="bg-[var(--bg-input)] border-slate-700 pr-10 focus:border-blue-500/50 text-white placeholder:text-slate-400"
                                        {...field}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-[var(--bg-input)]!"
                                    >
                                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {/* Confirm Password Field */}
                <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-medium text-slate-300">Confirm Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        // Thay thế màu cứng
                                        className="bg-[var(--bg-input)] border-slate-700 pr-10 focus:border-blue-500/50 text-white placeholder:text-slate-400"
                                        {...field}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-[var(--bg-input)]!"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-[var(--color-blue-600)]! hover:bg-[var(--color-blue-500)]! h-11 text-white font-semibold"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                        </>
                    ) : (
                        "Sign Up"
                    )}
                </Button>
            </form>
        </Form>
    );
}