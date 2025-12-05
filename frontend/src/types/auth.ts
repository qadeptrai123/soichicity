// src/types/auth.ts
export interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    avatarUrl?: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}
