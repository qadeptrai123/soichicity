import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import logo from "@/assets/logo.svg";
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
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
    const [isResetComplete, setIsResetComplete] = useState(false);
    const navigate = useNavigate();

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
        <div className="fixed inset-0 bg-background flex flex-col items-center overflow-auto p-4">
            {/* Decorative elements: Same as ForgotPassword component */}
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute top-0 left-0 opacity-70 bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute bottom-0 right-[5%] opacity-60 bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="w-80 h-80 absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 bg-blue-700/10 rounded-full blur-[80px]" />
            <div className="w-44 h-44 absolute top-[5%] left-[5%] origin-top-left rotate-24 rounded-[10px] border border-white/5" />
            <div className="w-24 h-24 absolute bottom-[10%] left-[10%] rounded-full border border-blue-500/10" />
            <div className="w-20 h-20 absolute top-[10%] right-[5%] rounded-[10px] border border-blue-400/10" />
            <div className="w-28 h-28 absolute bottom-[5%] right-0 rounded-full border border-blue-600/10" />


            <div className="flex flex-col items-center w-full mx-auto my-auto">
                {/* Main Card - Reset Password */}
                <Card className="w-full max-w-md bg-secondary backdrop-blur-xl border-border-secondary shadow-2xl shadow-black/50 mx-auto my-auto">
                    <CardHeader className="flex flex-col items-center mb-2">
                        <div className="w-15 h-15 bg-linear-to-tr bg-blue-500 rounded-full flex items-center justify-center">
                            <img
                                src={logo}
                                alt="App Logo"
                            />
                        </div>
                    </CardHeader>
                    <CardHeader className="flex flex-col items-center mb-2">
                        <div className="w-15 h-15 bg-linear-to-tr bg-[#1E2939] rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-[#155DFC]" strokeWidth={3} />
                        </div>

                        {/* Main Title */}
                        <CardTitle className="text-hd text-white tracking-tight">
                            <h2>Reset Your Password</h2>
                        </CardTitle>

                        {/* Description */}
                        <CardDescription className="text-slate-400 mt-2 text-center text-base">
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                                {/* New Password Field */}
                                <FormField
                                    control={form.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base text-slate-300">
                                                New Password
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter new password"
                                                        className="flex items-center bg-input! border-border! text-foreground placeholder-text-text-muted text-base py-6 pr-10"
                                                        {...field}
                                                    />

                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-base" />
                                        </FormItem>
                                    )}
                                />

                                {/* Confirm Password Field */}
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-medium text-text-secondary">
                                                Confirm Password
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="password"
                                                        placeholder="Re-enter your password"
                                                        className="flex items-center bg-input! border-border! text-foreground placeholder-text-text-muted text-base py-6 pr-10"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-base" />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full bg-primary! hover:bg-primary-hover! h-12 text-white text-base py-6"
                                >
                                    Reset Password
                                </Button>
                            </form>
                        </Form>

                        {/* Back to Login */}
                        <div className="text-center">
                            <a
                                onClick={() => navigate("/")}
                                className="inline-flex items-center text-base text-slate-400! hover:text-slate-300! transition-colors cursor-pointer"
                            >
                                Back to Sign in
                            </a>
                        </div>


                    </CardContent>

                </Card>

                {/* Notice: Choose strong password */}
                <p className="text-center text-ft text-slate-400 mt-6">
                    Make sure to choose a strong password that you haven't used before.
                </p>
            </div>
        </div>
    );
}