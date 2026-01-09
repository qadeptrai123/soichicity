import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const API_BASE_URL = "http://localhost:8000";

export const authAPI = {
    register: async (full_name: string, username: string, email: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name, username, email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Registration failed");
        }
        return response.json();
    },

    login: async (identifier: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append("username", identifier);
        formData.append("password", password);

        const response = await fetch(`${API_BASE_URL}/api/v1/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Login failed");
        }
        return response.json();
    },

    loginWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            return {
                access_token: idToken,
                token_type: "bearer",
                user: {
                    email: result.user.email,
                    displayName: result.user.displayName,
                    uid: result.user.uid,
                },
            };
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Google login failed");
        }
    },

    requestPasswordReset: async (email: string) => {
        try {
            // Configure redirection URL to our React app
            const redirectUrl = window.location.origin + '/reset-password';
            console.log("Sending password reset email with redirect URL:", redirectUrl);
            
            const actionCodeSettings = {
                url: redirectUrl, 
                handleCodeInApp: true,
            };
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
        } catch (error: any) {
            console.error("Error sending reset email:", error);
            throw new Error(error.message || "Failed to send password reset email.");
        }
    },

    completePasswordReset: async (oobCode: string, newPassword: string) => {
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
        } catch (error: any) {
             throw new Error(error.message || "Failed to reset password.");
        }
    }
};