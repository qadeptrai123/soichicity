import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import LogoImage from "../assets/logo.png"; // Import logo image
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
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/schemas/authSchema";

export default function ForgotPassword({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = (data: ForgotPasswordValues) => {
        console.log("Recovery Email:", data);
        alert(`Đã gửi yêu cầu reset tới: ${data.email}`);
    };

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

            <Card className="w-full max-w-md bg-[var(--bg-secondary)] backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/50">
                <CardHeader className="flex flex-col items-center mb-2">
                    <div className="w-15 h-15 bg-gradient-to-tr bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <img
                            src={LogoImage}
                            alt="App Logo"
                        />
                    </div>
                    <CardTitle className="text-xl text-white tracking-tight">
                        Forgot Password
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-2">
                        Enter your email address and we'll send you a link to get back into your account.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium text-slate-300">
                                            Email
                                        </FormLabel>
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
                            <Button
                                type="submit"
                                className="w-full bg-[var(--color-primary)]! hover:bg-[var(--color-primary-hover)]! h-11 text-white font-semibold"
                            >
                                Send Reset Link
                            </Button>
                        </form>
                    </Form>

                    {/* BACK TO LOGIN */}
                    <div className="text-center pt-2">
                        <a
                            onClick={() => setActiveTab?.("login")}
                            className="inline-flex items-center text-sm text-slate-400! hover:text-slate-300! transition-colors cursor-pointer"
                        >
                            Back to Login
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}