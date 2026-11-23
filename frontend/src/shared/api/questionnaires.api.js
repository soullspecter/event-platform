const API_URL = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}/questionnaires${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Ошибка запроса');
  }

  return data;
}

export const questionnairesApi = {
  getForEvent: eventId =>
    request(`/event/${eventId}`),

  getAvailable: eventId =>
    request(`/available/${eventId}`),

  create: data =>
    request('', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submit: (id, answers) =>
    request(`/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
};