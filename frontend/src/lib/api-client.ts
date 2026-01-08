import axios from "axios";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

const API_BASE_URL = "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================
// Helper: Error message
// =========================
function getErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong"
  );
}

// =========================
// Concurrency handling
// =========================
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// =========================
// Refresh token
// =========================
export async function refreshAccessToken(
  refreshToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${
        import.meta.env.VITE_FIREBASE_API_KEY
      }`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to refresh token");

    const data = await response.json();
    localStorage.setItem("access_token", data.id_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return data.id_token;
  } catch (error) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new Event("auth:logout"));
    return null;
  }
}

// =========================
// Token expiration check
// =========================
function isTokenExpiredOrExpiring(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const bufferTime = 5 * 60; // 5 minutes
    return decoded.exp && decoded.exp < currentTime + bufferTime;
  } catch {
    return true;
  }
}

// =========================
// REQUEST INTERCEPTOR
// =========================
apiClient.interceptors.request.use(
  async (config) => {
    const auth = getAuth();

    // 1. Firebase SDK (ưu tiên)
    let user = auth.currentUser;
    if (!user) {
      user = await new Promise<User | null>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          unsubscribe();
          resolve(u);
        });
        setTimeout(() => resolve(null), 1000);
      });
    }

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }

    // 2. Custom JWT (LocalStorage)
    let token = localStorage.getItem("access_token");

    if (token) {
      if (isTokenExpiredOrExpiring(token)) {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) return config;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (newToken: string) => {
                config.headers.Authorization = `Bearer ${newToken}`;
                resolve(config);
              },
              reject,
            });
          });
        }

        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken(refreshToken);
          if (newToken) {
            token = newToken;
            processQueue(null, newToken);
          } else {
            processQueue(new Error("Refresh failed"), null);
          }
        } finally {
          isRefreshing = false;
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR
// =========================
apiClient.interceptors.response.use(
  (response) => {
    // const method = response.config.method;

    // // Toast SUCCESS (chỉ cho non-GET + có message)
    // if (
    //   method !== "get" &&
    //   response.data?.message &&
    //   !response.config._retry
    // ) {
    //   toast.success(response.data.message);
    // }

    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ===== 401 Handling =====
    if (status === 401 && !originalRequest?._retry) {
      if (!getAuth().currentUser && localStorage.getItem("refresh_token")) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(apiClient(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            const newToken = await refreshAccessToken(refreshToken);
            if (newToken) {
              processQueue(null, newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return apiClient(originalRequest);
            }
          }
        } finally {
          isRefreshing = false;
        }
      }

      toast.warning("Session expired. Please login again.");
      window.dispatchEvent(new Event("auth:logout"));
    }

    // ===== Toast ERROR =====
    if (!originalRequest?._retry) {
      toast.error(getErrorMessage(error));
    }

    return Promise.reject(error);
  }
);
