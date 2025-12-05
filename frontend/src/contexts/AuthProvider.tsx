// src/context/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                setUser(token as unknown as User); // Giả sử token chứa thông tin user
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem("access_token");
                setUser(null);
            }
        }
    }, []);

    const login = (token: string) => {
        try {
            localStorage.setItem("access_token", token);
            setUser(token as unknown as User);
            // Đợi state update xong
            return new Promise(resolve => {
                setTimeout(resolve, 100);
            });
        } catch (error) {
            console.error("Invalid token:", error);
            setUser(null);
            throw error; // Throw error để LoginPrompt catch được
        }
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
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

