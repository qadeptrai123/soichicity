import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { apiClient } from "@/lib/api-client";

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

export const authAPI = {
  /** REGISTER */
  register: (payload: {
    full_name: string;
    username: string;
    email: string;
    password: string;
  }) => {
    return apiClient.post("/api/v1/register", payload);
  },

  /** LOGIN */
  login: (identifier: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", identifier);
    formData.append("password", password);

    return apiClient.post("/api/v1/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },

  /** LOGIN WITH GOOGLE (GIỮ NGUYÊN) */
  loginWithGoogle: async () => {
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
  },
};
