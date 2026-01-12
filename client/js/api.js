/**
 * API Module - Handles all HTTP requests to the backend
 */
const API = {
    baseUrl: '/api',

    // Generic request handler
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // Users
    users: {
        getAll: () => API.request('/users'),
        get: (id) => API.request(`/users/${id}`),
        create: (data) => API.request('/users', { method: 'POST', body: data }),
        update: (id, data) => API.request(`/users/${id}`, { method: 'PUT', body: data }),
        delete: (id) => API.request(`/users/${id}`, { method: 'DELETE' })
    },

    // Campaigns
    campaigns: {
        getAll: () => API.request('/campaigns'),
        get: (id) => API.request(`/campaigns/${id}`),
        create: (data) => API.request('/campaigns', { method: 'POST', body: data }),
        update: (id, data) => API.request(`/campaigns/${id}`, { method: 'PUT', body: data }),
        delete: (id) => API.request(`/campaigns/${id}`, { method: 'DELETE' })
    },

    // Tasks
    tasks: {
        getAll: (filters = {}) => {
            const params = new URLSearchParams(filters).toString();
            return API.request(`/tasks${params ? '?' + params : ''}`);
        },
        get: (id) => API.request(`/tasks/${id}`),
        getCalendar: (month, year) => API.request(`/tasks/calendar?month=${month}&year=${year}`),
        create: (data) => API.request('/tasks', { method: 'POST', body: data }),
        update: (id, data) => API.request(`/tasks/${id}`, { method: 'PUT', body: data }),
        updateStatus: (id, status, order) => API.request(`/tasks/${id}/status`, {
            method: 'PATCH',
            body: { status, order }
        }),
        delete: (id) => API.request(`/tasks/${id}`, { method: 'DELETE' }),
        reorder: (tasks) => API.request('/tasks/reorder/batch', { method: 'PUT', body: { tasks } })
    },

    // Stats
    stats: {
        getDashboard: () => API.request('/stats/dashboard'),
        getCampaignStats: (id) => API.request(`/stats/campaigns/${id}`)
    }
};
