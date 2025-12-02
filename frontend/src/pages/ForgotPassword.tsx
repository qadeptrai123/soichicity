import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import LoginImage from "../assets/logo.png";

// Shadcn Components
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// Schemas
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/schemas/authSchema";

export default function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("Recovery Email:", data);
        alert(`Password reset request sent to: ${data.email}`);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-background flex flex-col justify-center items-center overflow-auto p-4">
            {/* Decorative elements */}
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute top-0 left-0 opacity-70 bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute bottom-0 right-[5%] opacity-60 bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="w-80 h-80 absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 bg-blue-700/10 rounded-full blur-[80px]" />
            <div className="w-44 h-44 absolute top-[5%] left-[5%] origin-top-left rotate-24 rounded-[10px] border border-white/5" />
            <div className="w-24 h-24 absolute bottom-[10%] left-[10%] rounded-full border border-blue-500/10" />
            <div className="w-20 h-20 absolute top-[10%] right-[5%] rounded-[10px] border border-blue-400/10" />
            <div className="w-28 h-28 absolute bottom-[5%] right-0 rounded-full border border-blue-600/10" />

            <Card className="w-full max-w-md bg-secondary backdrop-blur-xl border-border-secondary shadow-2xl shadow-black/50">
                <CardHeader className="flex flex-col items-center mb-2">
                    <div className="w-15 h-15 bg-linear-to-tr bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <img src={LoginImage} alt="App Logo" />
                    </div>
                    <CardTitle className="text-xl text-white text-hd tracking-tight">
                        Forgot Password
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-base text-center mt-2">
                        Enter your email address and we'll send you a link to get back into your account.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            {/* Email Field */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-slate-300">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
                                                className="flex items-center bg-input! border-border! focus:border-blue-accent/50 text-foreground placeholder-text-text-muted py-6 text-base"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-base" />
                                    </FormItem>
                                )}
                            />

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full bg-primary! hover:bg-primary-hover! h-11 text-white text-base py-6"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>

                            {/* Back to Login */}
                            <div className="text-center text-base text-slate-400">
                                <span
                                    onClick={() => navigate("/")}
                                    className="text-base text-slate-400 hover:text-slate-300 transition-all cursor-pointer"
                                >
                                    Back to Login
                                </span>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <p className="text-center text-ft text-slate-400 mt-6">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
}