// src/context/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            const payload = parseJwt(token);
            setUser(payload);
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem("access_token", token);
        const payload = parseJwt(token);
        setUser(payload);
    };


    const logout = () => {
        localStorage.removeItem("access_token");
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


const parseJwt = (token: string): User => {
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload;
}
