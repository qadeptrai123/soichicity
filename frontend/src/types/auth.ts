// src/types/auth.ts
import type { User } from './user';

export type { User }; // Re-export for convenience

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    refreshUser: (updatedData?: Partial<User>) => Promise<void>;
}
