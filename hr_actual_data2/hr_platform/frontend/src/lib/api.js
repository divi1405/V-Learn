// Extremely explicit check for Vercel
const envUrl = process.env.NEXT_PUBLIC_API_URL;
console.log("----- VERCEL ENV CHECK -----");
console.log("Raw NEXT_PUBLIC_API_URL is:", envUrl);
console.log("-----------------------------");

const API_BASE = envUrl || "/api";
console.log("Final API_BASE being used is:", API_BASE);

class ApiClient {
    constructor() {
        this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    }

    setToken(token) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    getUser() {
        if (typeof window !== 'undefined') {
            const u = localStorage.getItem('user');
            return u ? JSON.parse(u) : null;
        }
        return null;
    }

    setUser(user) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }

    async request(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        console.log(`Sending request to: ${API_BASE}${path}`);
        const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...options, headers });
        if (res.status === 401) {
            this.clearToken();
            if (typeof window !== 'undefined') window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(err.detail || 'Request failed');
        }
        if (res.status === 204) return null;
        return res.json();
    }

    get(path) { return this.request(path); }
    post(path, data) { return this.request(path, { method: 'POST', body: JSON.stringify(data) }); }
    put(path, data) { return this.request(path, { method: 'PUT', body: JSON.stringify(data) }); }
    delete(path) { return this.request(path, { method: 'DELETE' }); }

    // Auth
    async login(email, password) {
        const data = await this.post('/auth/login', { email, password });
        this.setToken(data.access_token);
        this.setUser(data.user);
        return data;
    }

    async register(userData) {
        const data = await this.post('/auth/register', userData);
        this.setToken(data.access_token);
        this.setUser(data.user);
        return data;
    }

    logout() {
        this.clearToken();
        if (typeof window !== 'undefined') window.location.href = '/login';
    }
}

const api = new ApiClient();
export default api;
