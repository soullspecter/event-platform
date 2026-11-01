import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'

import { authApi } from '../../../api/auth.api.js'

export default function Login({ active, onSwitchToRegister, onSuccess }) {
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	async function handleSubmit(event) {
		event.preventDefault()
		setError('')
		setLoading(true)

		const formData = new FormData(event.currentTarget)

		try {
			const session = await authApi.login({
				email: String(formData.get('email') || '').trim(),
				password: String(formData.get('password') || ''),
			})

			onSuccess?.(session)
		} catch (requestError) {
			setError(requestError.message || 'Не удалось войти в аккаунт.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<section
			className={`auth-panel__form auth-panel__form--login ${
				active ? 'auth-panel__form--active' : ''
			}`}
			aria-hidden={!active}
			inert={!active}
		>
			<div className='auth-panel__heading'>
				<h1 id='login-title'>Снова с нами</h1>
				<p>Войди в аккаунт и продолжай открывать новое.</p>
			</div>

			<form className='auth-form' onSubmit={handleSubmit}>
				<label className='auth-form__label' htmlFor='login-email'>
					Email
				</label>

				<div className='auth-form__input-wrap'>
					<Mail size={18} aria-hidden='true' />
					<input
						id='login-email'
						name='email'
						type='email'
						placeholder='you@example.com'
						autoComplete='email'
						maxLength={255}
						required
						disabled={loading}
						tabIndex={active ? 0 : -1}
					/>
				</div>

				<label className='auth-form__label' htmlFor='login-password'>
					Пароль
				</label>

				<div className='auth-form__input-wrap'>
					<LockKeyhole size={18} aria-hidden='true' />
					<input
						id='login-password'
						name='password'
						type={showPassword ? 'text' : 'password'}
						placeholder='Введи пароль'
						autoComplete='current-password'
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
				</div>

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
					{loading ? 'Входим…' : 'Войти'}
					{!loading && <ArrowRight size={18} />}
				</button>
			</form>

			<p className='auth-panel__switch'>
				Ещё нет аккаунта?{' '}
				<button
					type='button'
					onClick={onSwitchToRegister}
					disabled={loading}
					tabIndex={active ? 0 : -1}
				>
					Зарегистрироваться
				</button>
			</p>
		</section>
	)
}
