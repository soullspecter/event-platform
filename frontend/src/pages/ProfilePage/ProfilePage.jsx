import { useEffect, useState } from 'react'
import {
	CalendarDays,
	CheckCircle2,
	CircleUserRound,
	LogOut,
	Mail,
	ShieldCheck,
	UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../shared/api/auth.api.js'
import './ProfilePage.scss'

function formatDate(value) {
	if (!value) return 'Не указана'

	const date = new Date(value)

	if (Number.isNaN(date.getTime())) return 'Не указана'

	return new Intl.DateTimeFormat('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(date)
}

function getInitials(user) {
	const first = user?.firstName?.trim()?.[0] || ''
	const last = user?.lastName?.trim()?.[0] || ''

	return `${first}${last}`.toUpperCase() || '?'
}

export default function ProfilePage() {
	const navigate = useNavigate()
	const [user, setUser] = useState(() => authApi.getUser())
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let cancelled = false

		async function loadProfile() {
			if (!authApi.getToken()) {
				navigate('/', { replace: true })
				return
			}

			try {
				const response = await authApi.getProfile()

				if (!cancelled) {
					setUser(response.user)
					setError('')
				}
			} catch (err) {
				if (cancelled) return

				setError(err.message || 'Не удалось загрузить профиль.')

				authApi.logout()
				setUser(null)
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		loadProfile()

		return () => {
			cancelled = true
		}
	}, [navigate])

	function handleLogout() {
		authApi.logout()
		navigate('/', { replace: true })
		window.location.reload()
	}

	if (loading) {
		return (
			<main className='profile-page'>
				<div className='profile-page__loading'>
					<span className='profile-page__spinner' />
					<p>Загружаем профиль...</p>
				</div>
			</main>
		)
	}

	if (!user) {
		return (
			<main className='profile-page'>
				<section className='profile-page__message'>
					<CircleUserRound size={40} />
					<h1>Не удалось открыть профиль</h1>
					<p>{error || 'Войди в аккаунт, чтобы посмотреть свои данные.'}</p>
				</section>
			</main>
		)
	}

	const fullName = [user.lastName, user.firstName, user.middleName]
		.filter(Boolean)
		.join(' ')

	return (
		<main className='profile-page'>
			<div className='profile-page__container'>
				<header className='profile-hero'>
					<div className='profile-hero__decoration profile-hero__decoration--one' />
					<div className='profile-hero__decoration profile-hero__decoration--two' />

					<div className='profile-hero__avatar'>{getInitials(user)}</div>

					<div className='profile-hero__info'>
						<span className='profile-hero__eyebrow'>ТВОЁ ПРОСТРАНСТВО</span>

						<h1>{fullName || 'Мой профиль'}</h1>
						<p>{user.email}</p>

						<span className='profile-hero__status'>
							<CheckCircle2 size={15} />
							Аккаунт активен
						</span>
					</div>

					<div className='profile-hero__sparkle'>
						<ShieldCheck size={30} />
					</div>
				</header>

				<section className='profile-section'>
					<div className='profile-section__heading'>
						<div className='profile-section__icon'>
							<UserRound size={21} />
						</div>

						<div>
							<h2>Личные данные</h2>
							<p>Информация, указанная при регистрации</p>
						</div>
					</div>

					<div className='profile-details'>
						<div className='profile-details__item'>
							<span>Фамилия</span>
							<strong>{user.lastName || 'Не указана'}</strong>
						</div>

						<div className='profile-details__item'>
							<span>Имя</span>
							<strong>{user.firstName || 'Не указано'}</strong>
						</div>

						<div className='profile-details__item'>
							<span>Отчество</span>
							<strong>{user.middleName || 'Не указано'}</strong>
						</div>

						<div className='profile-details__item'>
							<span>Дата рождения</span>
							<strong>{formatDate(user.birthDate)}</strong>
						</div>

						<div className='profile-details__item profile-details__item--wide'>
							<span>
								<Mail size={15} />
								Электронная почта
							</span>
							<strong>{user.email || 'Не указана'}</strong>
						</div>
					</div>
				</section>

				<section className='profile-section profile-section--account'>
					<div className='profile-section__heading'>
						<div className='profile-section__icon'>
							<ShieldCheck size={21} />
						</div>

						<div>
							<h2>Аккаунт</h2>
							<p>Управление доступом к платформе</p>
						</div>
					</div>

					<div className='profile-account'>
						<div className='profile-account__info'>
							<div className='profile-account__icon'>
								<CalendarDays size={20} />
							</div>
							<div>
								<strong>Место для впечатлений</strong>
								<p>Твой аккаунт на платформе «место»</p>
							</div>
						</div>

						<button
							className='profile-account__logout'
							type='button'
							onClick={handleLogout}
						>
							<LogOut size={17} />
							Выйти из аккаунта
						</button>
					</div>
				</section>
			</div>
		</main>
	)
}
