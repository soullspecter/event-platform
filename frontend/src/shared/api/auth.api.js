const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, '')

const TOKEN_KEY = 'access_token'
const USER_KEY = 'user'

async function request(path, { method = 'GET', body, token } = {}) {
	const headers = {
		Accept: 'application/json',
	}

	if (body !== undefined) {
		headers['Content-Type'] = 'application/json'
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	let response

	try {
		response = await fetch(`${API_URL}${path}`, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
		})
	} catch {
		throw new Error(
			'Не удалось подключиться к серверу. Проверь, запущен ли backend.',
		)
	}

	const contentType = response.headers.get('content-type') || ''

	let data

	try {
		data = contentType.includes('application/json')
			? await response.json()
			: await response.text()
	} catch {
		throw new Error('Сервер вернул некорректный ответ.')
	}

	if (!response.ok) {
		const message =
			typeof data === 'string'
				? data
				: Array.isArray(data?.message)
					? data.message.join(' ')
					: data?.message || data?.error

		throw new Error(message || `Ошибка сервера: ${response.status}`)
	}

	return data
}

function saveSession(data) {
	if (!data?.accessToken || !data?.user) {
		throw new Error('Сервер вернул неожиданный ответ авторизации.')
	}

	localStorage.setItem(TOKEN_KEY, data.accessToken)
	localStorage.setItem(USER_KEY, JSON.stringify(data.user))

	return data
}

function getUser() {
	const value = localStorage.getItem(USER_KEY)

	if (!value) return null

	try {
		return JSON.parse(value)
	} catch {
		localStorage.removeItem(USER_KEY)
		return null
	}
}

export const authApi = {
	async register(form) {
		const data = await request('/auth/register', {
			method: 'POST',
			body: {
				email: form.email.trim(),
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				middleName: form.middleName?.trim() || undefined,
				birthDate: form.birthDate,
				password: form.password,
			},
		})

		return saveSession(data)
	},

	async login(form) {
		const data = await request('/auth/login', {
			method: 'POST',
			body: {
				email: form.email.trim(),
				password: form.password,
			},
		})

		return saveSession(data)
	},

	async getProfile() {
		const token = localStorage.getItem(TOKEN_KEY)

		if (!token) {
			throw new Error('Необходимо войти в аккаунт.')
		}

		return request('/auth/profile', { token })
	},

	getToken() {
		return localStorage.getItem(TOKEN_KEY)
	},

	getUser,

	logout() {
		localStorage.removeItem(TOKEN_KEY)
		localStorage.removeItem(USER_KEY)
	},
}
