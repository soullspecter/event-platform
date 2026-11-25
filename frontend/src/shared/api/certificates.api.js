const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

function getAccessToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
}

export const certificatesApi = {
    async uploadFile({ fileName, category, contentType, base64 }) {
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const token = getAccessToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);

        let response;
        try {
            response = await fetch(`${API_URL}/certificates/upload`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ fileName, category, contentType, base64 }),
            });
        } catch (error) {
            throw new Error('Не удалось подключиться к серверу для загрузки файла', { cause: error });
        }

        const raw = await response.text();
        let data = null;
        if (raw) {
            try { data = JSON.parse(raw); } catch { data = raw; }
        }
        if (!response.ok) {
            const message = typeof data === 'string' ? data : data?.message || `Ошибка загрузки (${response.status})`;
            throw new Error(message);
        }
        return data;
    },
};
