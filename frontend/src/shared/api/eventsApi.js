const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

function getAccessToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
}

async function request(path, options = {}) {
    const headers = new Headers(options.headers);
    const token = getAccessToken();

    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    let response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
        });
    } catch (error) {
        if (error.name === 'AbortError') throw error;

        throw new Error('Не удалось подключиться к серверу. Проверь, запущен ли backend.', { cause: error });
    }

    const raw = await response.text();
    let data = null;

    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            data = raw;
        }
    }

    if (!response.ok) {
        const message = typeof data === 'string' ? data : Array.isArray(data?.message) ? data.message.join('\n') : data?.message || data?.error || `Ошибка сервера (${response.status})`;

        throw new Error(message);
    }

    return data;
}

function post(path, payload) {
    return request(path, {
        method: 'POST',
        body: payload === undefined ? undefined : JSON.stringify(payload),
    });
}

function patch(path, payload) {
    return request(path, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

function remove(path) {
    return request(path, { method: 'DELETE' });
}

export const eventsApi = {
    // Создание черновика
    createDraft(payload) {
        return post('/events/drafts', payload);
    },

    // Обновление черновика
    updateDraft(eventId, payload) {
        return patch(`/events/${eventId}/draft`, payload);
    },

    // Публикация мероприятия
    publishEvent(eventId) {
        return post(`/events/${eventId}/publish`);
    },

    // Получение мероприятия для администрирования
    getForManagement(eventId) {
        return request(`/events/${eventId}/manage`);
    },

    // Получение мероприятий текущего пользователя
    getMyEvents() {
        return request('/events/mine');
    },

    // Получение списка опубликованных мероприятий
    getPublished() {
        return request('/events');
    },

    // Получение опубликованного мероприятия по ID
    getPublishedById(eventId) {
        return request(`/events/${eventId}`);
    },

    // Удаление мероприятия
    deleteEvent(eventId) {
        return remove(`/events/${eventId}`);
    },

    // Получение списка физических локаций
    getLocations() {
        return request('/locations');
    },
    // Получение списка черновиков (админ)
    getDrafts() {
        return request('/events/drafts');
    },
};
