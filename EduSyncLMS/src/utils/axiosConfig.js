import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with base URL
const axiosInstance = axios.create({
    baseURL: 'https://backendwebapi-ajhbbna7c3eucqbm.centralindia-01.azurewebsites.net/api',
    timeout: 10000
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration and refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response) {
            // Handle 401 Unauthorized errors (token expired)
            if (error.response.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    // If token refresh is in progress, add request to queue
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(token => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return axiosInstance(originalRequest);
                        })
                        .catch(err => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) {
                        throw new Error('No refresh token available');
                    }

                    const response = await axios.post('https://backendwebapi-ajhbbna7c3eucqbm.centralindia-01.azurewebsites.net/api/Auth/refresh-token', {
                        refreshToken: refreshToken
                    });

                    const { token, refreshToken: newRefreshToken } = response.data;
                    
                    // Update tokens in localStorage
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    // Update Authorization header
                    originalRequest.headers.Authorization = `Bearer ${token}`;

                    // Process queued requests
                    processQueue(null, token);

                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    
                    // Clear local storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    
                    // Show notification
                    toast.error('Your session has expired. Please log in again.');
                    
                    // Redirect to login page after a short delay
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);

                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
            
            // Handle other errors
            const errorMessage = error.response.data?.message || 'An error occurred';
            toast.error(errorMessage);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance; 