import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

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

// Schemas
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/schemas/authSchema";

interface ForgotPasswordFormProps {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    setActiveTab?: (tab: string) => void;
}

export function ForgotPasswordForm({ isLoading, setIsLoading, setActiveTab }: ForgotPasswordFormProps) {
    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        setIsLoading(true);
        // Giả lập gọi API
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("Recovery Email:", data);
        alert(`Đã gửi yêu cầu reset tới: ${data.email}`);
        setIsLoading(false);
    };

    return (
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
                                    className="flex items-center bg-[var(--bg-input)] border-slate-700 focus:border-blue-500/50 text-white placeholder:text-slate-400 py-6 text-base"
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
                    className="w-full bg-[var(--color-primary)]! hover:bg-[var(--color-primary-hover)]! h-11 text-white text-base py-6"
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
                <div className="text-center pt-2 -mb-8">
                    <a
                        onClick={() => setActiveTab?.("login")}
                        className="inline-flex items-center text-base text-slate-400! hover:text-slate-300! transition-colors cursor-pointer"
                    >
                        Back to Login
                    </a>
                </div>
            </form>
        </Form>
    );
}