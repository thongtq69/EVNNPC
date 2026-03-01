import axios from 'axios';

const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = import.meta.env.VITE_API_BASE_URL || (isLocalHost ? 'http://localhost:3000/api' : 'https://electronic-b.vercel.app/api');

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('truythu_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const AuthAPI = {
    async login(username, password) {
        const { data } = await api.post('/auth/login', { username, password });
        localStorage.setItem('truythu_token', data.token);
        localStorage.setItem('truythu_user', JSON.stringify({ username: data.username, role: data.role }));
        return data;
    },

    logout() {
        localStorage.removeItem('truythu_token');
        localStorage.removeItem('truythu_user');
    },

    getUser() {
        const user = localStorage.getItem('truythu_user');
        return user ? JSON.parse(user) : null;
    },

    isLoggedIn() {
        return !!localStorage.getItem('truythu_token');
    }
};

export const CalculationAPI = {
    async save(data) {
        const { data: result } = await api.post('/calculations', data);
        return result;
    },

    async getAll() {
        const { data } = await api.get('/calculations');
        return data;
    }
};

export const HealthAPI = {
    async check() {
        try {
            const { data } = await api.get('/health');
            return data;
        } catch {
            return { status: 'offline' };
        }
    }
};

export const PriceAPI = {
    async getConfig() {
        const { data } = await api.get('/prices');
        return data;
    },
    async saveConfig(payload) {
        const { data } = await api.put('/prices', payload);
        return data;
    }
};

export const AdminAPI = {
    async getUsers() {
        const { data } = await api.get('/admin/users');
        return data;
    },
    async createUser(userData) {
        const { data } = await api.post('/admin/users', userData);
        return data;
    }
};

export default api;
