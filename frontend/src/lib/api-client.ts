import axios from "axios";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// logic xử lý concurrency (chống gọi trùng)
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function refreshAccessToken(
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
    console.error("Token refresh failed:", error);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new Event("auth:logout"));
    return null;
  }
}

function isTokenExpiredOrExpiring(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const bufferTime = 5 * 60;
    return decoded.exp && decoded.exp < currentTime + bufferTime;
  } catch (error) {
    return true;
  }
}

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  async (config) => {
    const auth = getAuth();

    // 1. Ưu tiên Firebase SDK
    let user = auth.currentUser;
    if (!user) {
      // Logic chờ user load
      user = await new Promise<User | null>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          unsubscribe();
          resolve(u);
        });
        setTimeout(() => resolve(null), 1000);
      });
    }

    if (user) {
      // Firebase SDK tự handle refresh
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }

    // 2. Fallback sang LocalStorage (Custom Login)
    let token = localStorage.getItem("access_token");

    if (token) {
      if (isTokenExpiredOrExpiring(token)) {
        // Nếu token sắp hết hạn, kiểm tra xem có đang refresh không
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          // Không cứu được, cứ gửi đi để response interceptor xử lý hoặc logout
          return config;
        }

        if (isRefreshing) {
          // Nếu đang có thằng khác refresh, thì request này xếp hàng chờ
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (newToken: string) => {
                config.headers.Authorization = `Bearer ${newToken}`;
                resolve(config);
              },
              reject: (err: any) => {
                reject(err);
              },
            });
          });
        }

        // Nếu chưa ai refresh, thì mình làm "trưởng nhóm" đi refresh
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken(refreshToken);
          if (newToken) {
            token = newToken;
            processQueue(null, newToken); // Báo cho các request đang chờ
          } else {
            processQueue(new Error("Refresh failed"), null);
          }
        } catch (e) {
          processQueue(e, null);
        } finally {
          isRefreshing = false;
        }
      }

      // Gán token (mới hoặc cũ)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR (Thêm Retry Logic)
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa từng retry (tránh lặp vô hạn)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Firebase SDK thì nó tự refresh rồi,
      // nếu vẫn 401 tức là token không hợp lệ thật -> Logout.
      // Chỉ xử lý retry cho trường hợp LocalStorage

      if (!getAuth().currentUser && localStorage.getItem("refresh_token")) {
        if (isRefreshing) {
          // Tương tự như trên, nếu đang refresh thì chờ
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(apiClient(originalRequest));
              },
              reject: (err: any) => reject(err),
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
              return apiClient(originalRequest); // Gọi lại API ban đầu
            }
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
        } finally {
          isRefreshing = false;
        }
      }

      // Nếu không cứu được thì logout
      window.dispatchEvent(new Event("auth:logout"));
    }

    const message = error.response?.data?.detail || error.message;
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);
