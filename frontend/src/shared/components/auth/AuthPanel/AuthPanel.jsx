import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles } from 'lucide-react'

import Login from '../Login/Login.jsx'
import Register from '../Register/Register.jsx'
import './AuthPanel.scss'

export default function AuthPanel({ isOpen, onClose, onAuthenticated }) {
	const [activeForm, setActiveForm] = useState('login')

	const handleClose = useCallback(() => {
		setActiveForm('login')
		onClose?.()
	}, [onClose])

	const handleAuthenticated = useCallback(
		session => {
			onAuthenticated?.(session.user)
			handleClose()
		},
		[onAuthenticated, handleClose],
	)

	const switchToRegister = useCallback(() => {
		setActiveForm('register')
	}, [])

	const switchToLogin = useCallback(() => {
		setActiveForm('login')
	}, [])

	useEffect(() => {
		if (!isOpen) return

		const previousOverflow = document.body.style.overflow

		function handleKeyDown(event) {
			if (event.key === 'Escape') {
				handleClose()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		document.body.style.overflow = 'hidden'

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = previousOverflow
		}
	}, [isOpen, handleClose])

	if (!isOpen) return null

	return createPortal(
		<div
			className='auth-overlay'
			onMouseDown={event => {
				if (event.target === event.currentTarget) {
					handleClose()
				}
			}}
		>
			<aside
				className='auth-panel'
				role='dialog'
				aria-modal='true'
				aria-label='Авторизация'
			>
				<button
					className='auth-panel__close'
					type='button'
					onClick={handleClose}
					aria-label='Закрыть окно авторизации'
				></button>

				<div className='auth-panel__decoration'>
					<div className='auth-panel__decoration-icon'>
						<Sparkles size={25} />
					</div>

					<span className='auth-panel__orb auth-panel__orb--one' />
					<span className='auth-panel__orb auth-panel__orb--two' />

					<div className='auth-panel__decoration-content'>
						<span className='auth-panel__decoration-label'>
							ТВОЁ ПРОСТРАНСТВО ВПЕЧАТЛЕНИЙ
						</span>

						<h2>
							Встречайся.
							<br />
							Вдохновляйся.
							<br />
							Будь на месте.
						</h2>

						<p>Люди, идеи и события, которые делают каждый день интереснее.</p>
					</div>

					<div className='auth-panel__decoration-footer'>
						<span className='auth-panel__decoration-dot' />
						Новые впечатления начинаются здесь
					</div>
				</div>

				<div className='auth-panel__content'>
					<div className={`auth-panel__forms auth-panel__forms--${activeForm}`}>
						<Login
							active={activeForm === 'login'}
							onSwitchToRegister={switchToRegister}
							onSuccess={handleAuthenticated}
						/>

						<Register
							active={activeForm === 'register'}
							onSwitchToLogin={switchToLogin}
							onSuccess={handleAuthenticated}
						/>
					</div>
				</div>
			</aside>
		</div>,
		document.body,
	)
}
