import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon, Lock } from "lucide-react";
import LogoImage from "../assets/logo.png";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { resetPasswordSchema, type ResetPasswordValues } from "@/schemas/authSchema";
import LoginForm from "./Login";

export default function ResetPassword() {
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isResetComplete, setIsResetComplete] = useState(false);

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: "", confirmPassword: "" },
    });

    const onSubmit = (data: ResetPasswordValues) => {
        console.log("New Password Data:", data);
        alert("Password has been successfully reset!");
        setIsResetComplete(true);
    };

    if (isResetComplete) {
        return <LoginForm />;
    }

    return (
        <div className="fixed inset-0 bg-[var(--bg-primary)] flex flex-col justify-center items-center overflow-auto p-4">
            {/* Trang trí: Giữ nguyên như component ForgotPassword */}
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute top-0 left-0 opacity-70 bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute bottom-0 right-[5%] opacity-60 bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="w-80 h-80 absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 bg-blue-700/10 rounded-full blur-[80px]" />
            <div className="w-44 h-44 absolute top-[5%] left-[5%] origin-top-left rotate-24 rounded-[10px] border border-white/5" />
            <div className="w-24 h-24 absolute bottom-[10%] left-[10%] rounded-full border border-blue-500/10" />
            <div className="w-20 h-20 absolute top-[10%] right-[5%] rounded-[10px] border border-blue-400/10" />
            <div className="w-28 h-28 absolute bottom-[5%] right-0 rounded-full border border-blue-600/10" />


            {/* CARD CHÍNH - Reset Password */}
            <Card className="w-full max-w-md bg-[var(--bg-secondary)] backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/50">
                <CardHeader className="flex flex-col items-center mb-2">
                    <div className="w-15 h-15 bg-gradient-to-tr bg-blue-500 rounded-full flex items-center justify-center mb-4">
                        <img
                            src={LogoImage}
                            alt="App Logo"
                        />
                    </div>
                </CardHeader>
                <CardHeader className="flex flex-col items-center mb-2">
                    <div className="w-15 h-15 bg-gradient-to-tr bg-[#1E2939] rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-[#155DFC]" strokeWidth={3} />
                    </div>

                    {/* Tiêu đề chính */}
                    <CardTitle className="text-xl text-white tracking-tight">
                        Reset Password
                    </CardTitle>

                    {/* Mô tả */}
                    <CardDescription className="text-slate-400 mt-2 text-center">
                        Enter your new password below
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                            {/* Trường New Password */}
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium text-slate-300">
                                            New Password
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showNewPassword ? "text" : "password"}
                                                    placeholder="Enter new password"
                                                    className="bg-[var(--bg-input)] border-slate-700 focus:border-blue-500/50 text-white placeholder:text-slate-400 pr-10"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-[var(--bg-input)]!"
                                                >
                                                    {showNewPassword ? <EyeOffIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Trường Confirm Password */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium text-slate-300">
                                            Confirm Password
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Re-enter your password"
                                                    className="bg-[var(--bg-input)] border-slate-700 focus:border-blue-500/50 text-white placeholder:text-slate-400 pr-10"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-[var(--bg-input)]!"
                                                >
                                                    {showConfirmPassword ? <EyeOffIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-[var(--color-primary)]! hover:bg-[var(--color-primary-hover)]! h-11 text-white font-semibold"
                            >
                                Reset Password
                            </Button>
                        </form>
                    </Form>

                    {/* BACK TO LOGIN */}
                    <div className="text-center pt-2">
                        <a
                            onClick={() => setIsResetComplete(true)}
                            className="inline-flex items-center text-sm text-slate-400! hover:text-slate-300! transition-colors cursor-pointer"
                        >
                            Back to Sign in
                        </a>
                    </div>


                </CardContent>

            </Card>

            {/* Thông báo chọn mật khẩu mạnh */}
            <p className="text-center text-xs text-slate-400 mt-8">
                Make sure to choose a strong password that you haven't used before
            </p>
        </div>
    );
}