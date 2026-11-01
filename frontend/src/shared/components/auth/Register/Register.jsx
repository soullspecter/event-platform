import { useState } from 'react'
import {
	ArrowRight,
	CalendarDays,
	Eye,
	EyeOff,
	LockKeyhole,
	Mail,
	UserRound,
} from 'lucide-react'

import { authApi } from '../../../api/auth.api.js'

function formatBirthDate(value) {
	const digits = value.replace(/\D/g, '').slice(0, 8)

	if (digits.length <= 2) return digits
	if (digits.length <= 4) {
		return `${digits.slice(0, 2)}.${digits.slice(2)}`
	}

	return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

function normalizeBirthDate(value) {
	const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)

	if (!match) {
		throw new Error('Введи дату в формате ДД.ММ.ГГГГ.')
	}

	const [, dayText, monthText, yearText] = match
	const day = Number(dayText)
	const month = Number(monthText)
	const year = Number(yearText)
	const date = new Date(year, month - 1, day)

	const isValid =
		date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day

	if (!isValid || year < 1900) {
		throw new Error('Введи корректную дату рождения.')
	}

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	if (date > today) {
		throw new Error('Дата рождения не может быть в будущем.')
	}

	return `${yearText}-${monthText}-${dayText}`
}

function FormField({ id, label, icon: Icon, children }) {
	return (
		<div className='auth-form__field'>
			<label className='auth-form__label' htmlFor={id}>
				{label}
			</label>

			<div className='auth-form__input-wrap'>
				<Icon size={18} aria-hidden='true' />
				{children}
			</div>
		</div>
	)
}

export default function Register({ active, onSwitchToLogin, onSuccess }) {
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmation, setShowConfirmation] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	async function handleSubmit(event) {
		event.preventDefault()
		setError('')

		const formData = new FormData(event.currentTarget)
		const password = String(formData.get('password') || '')
		const confirmPassword = String(formData.get('confirmPassword') || '')

		if (password.length < 8) {
			setError('Пароль должен содержать не менее 8 символов.')
			return
		}

		if (password !== confirmPassword) {
			setError('Пароли не совпадают.')
			return
		}

		let birthDate

		try {
			birthDate = normalizeBirthDate(String(formData.get('birthDate') || ''))
		} catch (validationError) {
			setError(validationError.message)
			return
		}

		setLoading(true)

		try {
			const session = await authApi.register({
				email: String(formData.get('email') || '').trim(),
				firstName: String(formData.get('firstName') || '').trim(),
				lastName: String(formData.get('lastName') || '').trim(),
				middleName: String(formData.get('middleName') || '').trim(),
				birthDate,
				password,
			})

			onSuccess?.(session)
		} catch (requestError) {
			setError(requestError.message || 'Не удалось создать аккаунт.')
		} finally {
			setLoading(false)
		}
	}

	function handleBirthDateChange(event) {
		const input = event.currentTarget
		const previousPosition = input.selectionStart ?? input.value.length
		const previousValue = input.value
		const formattedValue = formatBirthDate(previousValue)

		input.value = formattedValue

		const digitsBeforeCursor = previousValue
			.slice(0, previousPosition)
			.replace(/\D/g, '').length

		let nextPosition = 0
		let digitsCount = 0

		while (
			nextPosition < formattedValue.length &&
			digitsCount < digitsBeforeCursor
		) {
			if (/\d/.test(formattedValue[nextPosition])) {
				digitsCount += 1
			}

			nextPosition += 1
		}

		if (formattedValue[nextPosition] === '.' && digitsCount > 0) {
			nextPosition += 1
		}

		input.setSelectionRange(nextPosition, nextPosition)
	}

	return (
		<section
			className={`auth-panel__form auth-panel__form--register ${
				active ? 'auth-panel__form--active' : ''
			}`}
			aria-hidden={!active}
			inert={!active}
		>
			<button
				className='auth-panel__back'
				type='button'
				onClick={onSwitchToLogin}
				disabled={loading}
				tabIndex={active ? 0 : -1}
			></button>

			<div className='auth-panel__heading'>
				<h1 id='register-title'>Создать аккаунт</h1>
				<p>Заполни данные, чтобы находить свои мероприятия.</p>
			</div>

			<form className='auth-form' onSubmit={handleSubmit}>
				<FormField id='register-email' label='Email' icon={Mail}>
					<input
						id='register-email'
						name='email'
						type='email'
						placeholder='you@example.com'
						autoComplete='email'
						maxLength={255}
						required
						disabled={loading}
						tabIndex={active ? 0 : -1}
					/>
				</FormField>

				<div className='auth-form__row'>
					<FormField id='register-first-name' label='Имя' icon={UserRound}>
						<input
							id='register-first-name'
							name='firstName'
							type='text'
							placeholder='Имя'
							autoComplete='given-name'
							maxLength={100}
							required
							disabled={loading}
							tabIndex={active ? 0 : -1}
						/>
					</FormField>

					<FormField id='register-last-name' label='Фамилия' icon={UserRound}>
						<input
							id='register-last-name'
							name='lastName'
							type='text'
							placeholder='Фамилия'
							autoComplete='family-name'
							maxLength={100}
							required
							disabled={loading}
							tabIndex={active ? 0 : -1}
						/>
					</FormField>
				</div>

				<FormField
					id='register-middle-name'
					label='Отчество (необязательно)'
					icon={UserRound}
				>
					<input
						id='register-middle-name'
						name='middleName'
						type='text'
						placeholder='Отчество'
						autoComplete='additional-name'
						maxLength={100}
						disabled={loading}
						tabIndex={active ? 0 : -1}
					/>
				</FormField>

				<FormField
					id='register-birth-date'
					label='Дата рождения'
					icon={CalendarDays}
				>
					<input
						id='register-birth-date'
						name='birthDate'
						type='text'
						placeholder='ДД.ММ.ГГГГ'
						inputMode='numeric'
						autoComplete='bday'
						maxLength={10}
						pattern='[0-9]{2}\.[0-9]{2}\.[0-9]{4}'
						title='Введи дату в формате ДД.ММ.ГГГГ'
						required
						disabled={loading}
						tabIndex={active ? 0 : -1}
						onChange={handleBirthDateChange}
					/>
				</FormField>

				<FormField id='register-password' label='Пароль' icon={LockKeyhole}>
					<input
						id='register-password'
						name='password'
						type={showPassword ? 'text' : 'password'}
						placeholder='Минимум 8 символов'
						autoComplete='new-password'
						minLength={8}
						maxLength={72}
						required
						disabled={loading}
						tabIndex={active ? 0 : -1}
					/>
					<button
						className='auth-form__visibility'
						type='button'
						onClick={() => setShowPassword(value => !value)}
						aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
						disabled={loading}
						tabIndex={active ? 0 : -1}
					>
						{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
					</button>
				</FormField>

				<FormField
					id='register-confirm-password'
					label='Подтверждение пароля'
					icon={LockKeyhole}
				>
					<input
						id='register-confirm-password'
						name='confirmPassword'
						type={showConfirmation ? 'text' : 'password'}
						placeholder='Повтори пароль'
						autoComplete='new-password'
						minLength={8}
						maxLength={72}
						required
						disabled={loading}
						tabIndex={active ? 0 : -1}
					/>
					<button
						className='auth-form__visibility'
						type='button'
						onClick={() => setShowConfirmation(value => !value)}
						aria-label={showConfirmation ? 'Скрыть пароль' : 'Показать пароль'}
						disabled={loading}
						tabIndex={active ? 0 : -1}
					>
						{showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
					</button>
				</FormField>

				{error && (
					<p
						className='auth-form__message auth-form__message--error'
						role='alert'
					>
						{error}
					</p>
				)}

				<button
					className='auth-form__submit'
					type='submit'
					disabled={loading}
					tabIndex={active ? 0 : -1}
				>
					{loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
					{!loading && <ArrowRight size={18} />}
				</button>
			</form>

			<p className='auth-panel__switch'>
				Уже есть аккаунт?{' '}
				<button
					type='button'
					onClick={onSwitchToLogin}
					disabled={loading}
					tabIndex={active ? 0 : -1}
				>
					Войти
				</button>
			</p>
		</section>
	)
}
