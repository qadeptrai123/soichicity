// src/context/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { User, AuthContextType } from "@/types/auth";
import { refreshAccessToken } from "@/lib/api-client";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem("access_token");
            if (token) {
                try {
                    const decoded: any = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    if (decoded.exp && decoded.exp < currentTime) {
                        console.log("Token expired, attempting refresh...");
                        const refreshToken = localStorage.getItem("refresh_token");
                        if (refreshToken) {
                            try {
                                const newToken = await refreshAccessToken(refreshToken);
                                if (newToken) {
                                    await login(newToken);
                                    return;
                                }
                            } catch (refreshErr) {
                                console.error("Refresh failed during init:", refreshErr);
                            }
                        }
                        logout();
                    } else {
                        // Token valid, set user state
                        setUser({
                            uid: decoded.user_id || decoded.uid || decoded.sub,
                            username: decoded.username || decoded.sub,
                            email: decoded.email || "",
                            full_name: decoded.name || decoded.full_name || "",
                            avatar_url: decoded.avatar_url || decoded.picture,
                            bio: decoded.bio || "",
                            is_active: decoded.is_active ?? true,
                            provider: decoded.provider || "password",
                            created_at: decoded.created_at || "",
                            followers_count: decoded.followers_count || 0,
                            followings_count: decoded.followings_count || 0,
                            blocks_count: decoded.blocks_count || 0,
                            reposts_count: decoded.reposts_count || 0,
                            saves_count: decoded.saves_count || 0,
                            likes_count: decoded.likes_count || 0,
                            notifications_count: decoded.notifications_count || 0,
                        });
                    }
                } catch (error) {
                    console.error("Invalid token:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();

        const handleLogoutEvent = () => logout();
        window.addEventListener("auth:logout", handleLogoutEvent);
        return () => window.removeEventListener("auth:logout", handleLogoutEvent);
    }, []);

    const login = (token: string) => {
        try {
            const decoded: any = jwtDecode(token);
            localStorage.setItem("access_token", token);

            setUser({
                uid: decoded.user_id || decoded.uid || decoded.sub,
                username: decoded.username || decoded.sub,
                email: decoded.email || "",
                full_name: decoded.name || decoded.full_name || "",
                avatar_url: decoded.avatar_url || decoded.picture,
                bio: decoded.bio || "",
                is_active: decoded.is_active ?? true,
                provider: decoded.provider || "password",
                created_at: decoded.created_at || "",
                followers_count: decoded.followers_count || 0,
                followings_count: decoded.followings_count || 0,
                blocks_count: decoded.blocks_count || 0,
                reposts_count: decoded.reposts_count || 0,
                saves_count: decoded.saves_count || 0,
                likes_count: decoded.likes_count || 0,
                notifications_count: decoded.notifications_count || 0,
            });

            // Đợi state update xong
            return new Promise(resolve => {
                setTimeout(resolve, 100);
            });
        } catch (error) {
            console.error("Invalid token:", error);
            setUser(null);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        // Optional: Redirect to login page if not handled by protected routes
    };

    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center">Loading...</div>; // Or <LoadingSpinner />
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth phải dùng trong AuthProvider");
    return ctx;
};

