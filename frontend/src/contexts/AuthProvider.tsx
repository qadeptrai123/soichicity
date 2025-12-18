// src/context/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { User, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        // console.log(token)
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                // console.log(decoded)
                if (decoded.exp && decoded.exp < currentTime) {
                    console.log("Token expired");
                    logout();
                } else {
                    // Map decoded token to User object
                    // Adjust these fields based on your actual JWT payload
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

