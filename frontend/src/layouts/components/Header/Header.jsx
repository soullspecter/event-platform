import { NavLink, Link } from 'react-router-dom'
import { CalendarDays, LogIn, PanelLeft } from 'lucide-react'

import './Header.scss'

export default function Header({ user, onOpenAuth, onToggleSidebar }) {
	return (
		<header className='topbar'>
			<button
				className='topbar__sidebar-toggle'
				type='button'
				onClick={onToggleSidebar}
				aria-label='Открыть панель'
			>
				<PanelLeft size={20} strokeWidth={2} />
			</button>
			<NavLink to='/' className='topbar__brand'>
				<span className='topbar__brand-name'>EOT</span>
			</NavLink>

			<nav className='topbar__nav' aria-label='Основная навигация'>
				<NavLink
					to='/'
					end
					className={({ isActive }) =>
						`topbar__link${isActive ? ' topbar__link--active' : ''}`
					}
				>
					<CalendarDays size={18} strokeWidth={1.9} />
					<span>Мероприятия</span>
				</NavLink>
			</nav>

			<div className='topbar__actions'>
				{user ? (
					<Link to='/profile' className='topbar__profile-link'>
						<span className='topbar__profile-avatar' aria-hidden='true'>
							{user.firstName?.[0]}
							{user.lastName?.[0]}
						</span>
						<span>{user.firstName}</span>
					</Link>
				) : (
					<button className='topbar__login' type='button' onClick={onOpenAuth}>
						<LogIn size={18} strokeWidth={2} />
						<span>Войти</span>
					</button>
				)}
			</div>
		</header>
	)
}
