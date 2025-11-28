import { useState, lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { RegisterForm } from "./Register";
import ForgotPassword from "./ForgotPassword";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Schemas
import { loginSchema, type LoginValues } from "@/schemas/authSchema";

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    // --- FORM ĐĂNG NHẬP ---
    const loginForm = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onLoginSubmit = async (data: LoginValues) => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("Login Data:", data);
        setIsLoading(false);
    };

    if (activeTab === "forgot") {
        return (
            <div>
                <ForgotPassword setActiveTab={setActiveTab} />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[var(--bg-primary)] flex justify-center items-center overflow-auto p-4">
            {/* Trang trí */}
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute top-0 left-0 opacity-70 bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute bottom-0 right-[5%] opacity-60 bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="w-80 h-80 absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 bg-blue-700/10 rounded-full blur-[80px]" />
            <div className="w-44 h-44 absolute top-[5%] left-[5%] origin-top-left rotate-24 rounded-[10px] border border-white/5" />
            <div className="w-24 h-24 absolute bottom-[10%] left-[10%] rounded-full border border-blue-500/10" />
            <div className="w-20 h-20 absolute top-[10%] right-[5%] rounded-[10px] border border-blue-400/10" />
            <div className="w-28 h-28 absolute bottom-[5%] right-0 rounded-full border border-blue-600/10" />

            {/* Header */}
            <Card className="w-full max-w-md bg-[var(--bg-secondary)] backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/50">
                <CardHeader className="flex flex-col items-center mb-2">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-6 h-6 text-white"
                        >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                        </svg>
                    </div>
                    <CardTitle className="text-xl text-white tracking-tight">Welcome</CardTitle>
                    <CardDescription className="text-slate-400 mt-2">Sign in or create an account</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* GOOGLE LOGIN BUTTON */}
                    <Button variant="outline" className="w-full h-11 bg-white! text-slate-900 hover:bg-slate-50 border-0 font-medium relative group">
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </Button>

                    {/* DIVIDER OR */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-700/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[var(--bg-secondary)] px-3 text-slate-500">or</span>
                        </div>
                    </div>

                    {/* MAIN FORM */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsContent value="login" className="space-y-5">
                            <Form {...loginForm}>
                                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                                    <FormField
                                        control={loginForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-medium text-slate-300">Email or Username</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="you@example.com"
                                                        className="bg-[var(--bg-input)] border-slate-700 focus:border-blue-500/50 text-white placeholder:text-slate-400"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={loginForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-medium text-slate-300">Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Enter your password"
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

                                    <div className="flex justify-end">
                                        <a
                                            onClick={() => setActiveTab("forgot")}
                                            className="text-s font-medium text-[var(--color-primary)]! hover:text-[var(--color-primary-hover)]! hover:underline transition-all cursor-pointer"
                                        >
                                            Forgot password?
                                        </a>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-[var(--color-primary)]! hover:bg-[var(--color-primary-hover)]! h-11 text-white! font-semibold"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Signing In...
                                            </>
                                        ) : (
                                            "Sign In"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="register" className="space-y-5">
                            <RegisterForm
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>

                {/* FOOTER LINK */}
                <div className="mt-8 text-center pb-8 px-8">
                    <p className="text-sm text-slate-400">
                        {activeTab === "login" ? (
                            <>
                                Don't have account?{" "}
                                <a
                                    onClick={() => setActiveTab("register")}
                                    className="text-[var(--color-primary)]! hover:text-[var(--color-primary-hover)]! font-medium hover:underline transition-all pl-2 cursor-pointer"
                                >
                                    Sign Up
                                </a>
                            </>
                        ) : (
                            <>
                                Already have account?{" "}
                                <a
                                    onClick={() => setActiveTab("login")}
                                    className="text-[var(--color-primary)]! hover:text-[var(--color-primary-hover)]! font-medium hover:underline transition-all pl-2 cursor-pointer"
                                >
                                    Sign In
                                </a>
                            </>
                        )}
                    </p>
                </div>
            </Card>
        </div>
    );
}