import { authAPI } from "../services/authAPI";
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
import { registerSchema, type RegisterValues } from "@/schemas/authSchema";

export default function Register() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const navigate = useNavigate();

    const registerForm = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { full_name: "", username: "", email: "", password: "", confirmPassword: "" },
    });

    const onRegisterSubmit = async (data: RegisterValues) => {
        setIsLoading(true);
        try {
            await authAPI.register(data.full_name, data.username, data.email, data.password);
            alert("Registration successful! Please log in.");
            navigate("/login");
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Registration failed";

            // Gắn lỗi vào field tương ứng dựa vào message
            if (errorMsg.includes("Username already taken")) {
                registerForm.setError("username", {
                    type: "manual",
                    message: errorMsg,
                });
            } else if (errorMsg.includes("Email already")) {
                registerForm.setError("email", {
                    type: "manual",
                    message: errorMsg,
                });
            } else {
                registerForm.setError("email", {
                    type: "manual",
                    message: errorMsg,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setIsGoogleLoading(true);
        try {
            const response = await authAPI.loginWithGoogle();

            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("user_email", response.user.email || "");

            alert("Registration successful!");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Google registration failed");
        } finally {
            setIsGoogleLoading(false);
        }
    };



    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center overflow-auto p-4 pt-5">
            {/* Decorative elements */}
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute top-0 left-0 opacity-70 bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute bottom-0 right-[5%] opacity-60 bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="w-80 h-80 absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 bg-blue-700/10 rounded-full blur-[80px]" />
            <div className="w-44 h-44 absolute top-[5%] left-[5%] origin-top-left rotate-24 rounded-[10px] border border-white/5" />
            <div className="w-24 h-24 absolute bottom-[10%] left-[10%] rounded-full border border-blue-500/10" />
            <div className="w-20 h-20 absolute top-[10%] right-[5%] rounded-[10px] border border-blue-400/10" />
            <div className="w-28 h-28 absolute bottom-[5%] right-0 rounded-full border border-blue-600/10" />

            <div className="flex flex-col items-center w-full mx-auto my-auto">
                <Card className="w-full max-w-md bg-secondary backdrop-blur-xl border-border-secondary shadow-2xl shadow-black/50 mx-auto my-auto">
                    <CardHeader className="flex flex-col items-center mb-1">
                        <div className="w-12 h-12 bg-linear-to-tr bg-blue-500 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-blue-500/30">
                            <img src={LoginImage} alt="App Logo" />
                        </div>
                        <CardTitle className="text-lg text-white text-hd tracking-tight">
                            Create Account
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-base text-center mt-1">
                            Sign up to get started with yout account
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Button onClick={handleGoogleRegister} disabled={isGoogleLoading} variant="outline" className="w-full h-12 bg-white! text-slate-900 hover:bg-slate-50 border-0 text-base">
                            <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-base uppercase">
                                <span className="bg-secondary px-3 text-text-muted">or</span>
                            </div>
                        </div>

                        <Form {...registerForm}>
                            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-2">
                                <FormField
                                    control={registerForm.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base text-slate-300">Full Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your full name"
                                                    className="flex items-center bg-input! border-border! text-foreground placeholder-text-text-muted text-base py-6"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400 text-base font-semibold mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={registerForm.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base text-slate-300">Username</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Choose a username"
                                                    className="flex items-center bg-input! border-border! text-foreground placeholder-text-text-muted text-base py-6"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400 text-base font-semibold mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={registerForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base text-slate-300">Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    className="flex items-center bg-input! border-border! text-foreground placeholder-text-text-muted text-base py-6"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400 text-base font-semibold mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={registerForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base text-slate-300">Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="password"
                                                        placeholder="Create a password"
                                                        className="flex items-center bg-input! border-border! pr-10 text-foreground placeholder-text-text-muted text-base py-6"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400 text-base font-semibold mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={registerForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base text-slate-300">Confirm Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="password"
                                                        placeholder="Confirm your password"
                                                        className="flex items-center bg-input! border-border! pr-10 text-foreground placeholder-text-text-muted text-base py-6"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400 text-base font-semibold mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600! hover:bg-blue-500! h-12 text-sm mt-3"
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
                    </CardContent>

                    {/* Back to Login */}
                    <div className="mt-0 text-center pb-0 px-8">
                        <p className="text-base text-slate-400">
                            Already have an account?{" "}
                            <span
                                onClick={() => navigate("/login")}
                                className="text-primary hover:text-primary-hover! hover:underline transition-all cursor-pointer pl-10"
                            >
                                Sign in
                            </span>
                        </p>
                    </div>

                </Card>

                <p className="text-center text-ft text-slate-400 mt-6 ">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>

        </div>
    );
}