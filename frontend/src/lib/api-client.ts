import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE_URL = "http://localhost:8000";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;
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
    const message = error.response?.data?.detail || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
});
