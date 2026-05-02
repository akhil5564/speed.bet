import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In a real-world scenario, this would come from an environment variable
// e.g., process.env.EXPO_PUBLIC_API_URL
// export const BASE_URL = 'https://www.muralibajaj.site'; // Production URL
//export const BASE_URL = 'http://192.168.29.67:5000'; // Replace with your local machine's IP address for device testing
// export const BASE_URL = 'http://192.168.1.9:5000'; // Replace with your local machine's IP address for device testing
export const BASE_URL = "https://api.bitfixtechnologies.com"; // Replace with your local machine's IP address for device testing
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
