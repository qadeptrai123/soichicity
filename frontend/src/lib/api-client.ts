import axios from 'axios';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';

const API_BASE_URL = "http://localhost:8000";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    const auth = getAuth();

    const waitForUser = () => {
        return new Promise<User | null>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    };

    let user = auth.currentUser;
    if (!user) {
        user = await waitForUser();
    }

    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
    return response.data;
}, (error) => {
    if (error.response?.status === 401) {
        // Dispatch custom event for AuthProvider to handle logout
        window.dispatchEvent(new Event("auth:logout"));
    }
    const message = error.response?.data?.detail || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
});
