import { authAPI } from "../services/authAPI";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import LoginImage from "../assets/logo.png";
import { useAuth } from "@/contexts/AuthProvider";

// Toast
import { toast } from "sonner";


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
import { loginSchema, type LoginValues } from "@/schemas/authSchema";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  // ======================
  // LOGIN WITH PASSWORD
  // ======================
  const onLoginSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    const toastId = toast.loading("Signing in...");

    try {
      const response = await authAPI.login(data.identifier, data.password);

      login(response.access_token);
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }

      toast.success("Login successful", {
        id: toastId,
        description: "Welcome back 👋",
      });

      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed";

      toast.error("Login failed", {
        id: toastId,
        description: message,
      });

      loginForm.setError("password", {
        type: "manual",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ======================
  // GOOGLE LOGIN
  // ======================
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const toastId = toast.loading("Signing in with Google...");

    try {
      const response = await authAPI.loginWithGoogle();

      login(response.access_token);

      toast.success("Login successful", {
        id: toastId,
        description: "Signed in with Google 🚀",
      });

      navigate("/");
    } catch (error) {
      toast.error("Google login failed", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center overflow-auto p-4">
      {/* Decorative background */}
      <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute top-0 left-0 opacity-70 bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="w-[40vw] h-[40vw] max-w-lg max-h-lg absolute bottom-0 right-[5%] opacity-60 bg-blue-500/10 rounded-full blur-[100px]" />

      <div className="flex flex-col items-center w-full mx-auto my-auto">
        <Card className="w-full max-w-md bg-secondary backdrop-blur-xl border-border-secondary shadow-2xl shadow-black/50">
          <CardHeader className="flex flex-col items-center mb-2">
            <div className="w-15 h-15 bg-linear-to-tr bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <img src={LoginImage} alt="App Logo" />
            </div>
            <CardTitle className="text-xl text-white tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-slate-400 text-center mt-2">
              Sign in to continue to your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* GOOGLE LOGIN */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              variant="outline"
              className="w-full h-12 bg-white text-slate-900 hover:bg-slate-50"
            >
              Continue with Google
            </Button>

            {/* OR */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center uppercase text-sm">
                <span className="bg-secondary px-3 text-text-muted">or</span>
              </div>
            </div>

            {/* LOGIN FORM */}
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={loginForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12"
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
          </CardContent>

          <div className="text-center pb-4">
            <p className="text-slate-400">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-primary cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}