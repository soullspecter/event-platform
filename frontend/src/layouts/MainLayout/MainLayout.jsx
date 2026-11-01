import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import AuthPanel from '../../shared/components/auth/AuthPanel/AuthPanel.jsx'
import { authApi } from '../../shared/api/auth.api.js'
import Header from '../components/Header/Header.jsx'
import SideBar from '../components/SideBar/SideBar.jsx'
import './MainLayout.scss'

export default function MainLayout() {
	const [isAuthOpen, setIsAuthOpen] = useState(false)
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const [user, setUser] = useState(() => authApi.getUser())

	const isAdmin = user?.roles?.includes('admin')

	function openAuth() {
		setIsAuthOpen(true)
	}

	function closeAuth() {
		setIsAuthOpen(false)
	}

	function toggleSidebar() {
		setIsSidebarOpen(prev => !prev)
	}

	function closeSidebar() {
		setIsSidebarOpen(false)
	}

	return (
		<div className='app-layout'>
			<Header
				user={user}
				onOpenAuth={openAuth}
				onToggleSidebar={toggleSidebar}
			/>

			<main className='app-layout__main'>
				<Outlet />
			</main>

			<SideBar
				isOpen={isSidebarOpen}
				onClose={closeSidebar}
				isAdmin={isAdmin}
			/>

			<AuthPanel
				isOpen={isAuthOpen}
				onClose={closeAuth}
				onAuthenticated={setUser}
			/>
		</div>
	)
}
