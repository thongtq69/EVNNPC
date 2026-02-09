import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

let authToken = localStorage.getItem('truythu_token');

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

export default api;
