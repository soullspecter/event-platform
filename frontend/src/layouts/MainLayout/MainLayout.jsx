import { useEffect, useState } from 'react';
import { Outlet, useMatch } from 'react-router-dom';

import AuthPanel from '../../shared/components/auth/AuthPanel/AuthPanel.jsx';
import { authApi } from '../../shared/api/auth.api.js';
import { registrationsApi } from '../../shared/api/eventsApi.js';

import Header from '../components/Header/Header.jsx';
import SideBar from '../components/SideBar/SideBar.jsx';
import './MainLayout.scss';

export default function MainLayout() {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(() => authApi.getUser());

    const [registration, setRegistration] = useState({
        eventId: null,
        registered: null,
    });

    const eventMatch = useMatch('/events/:id');
    const eventId = eventMatch?.params.id ?? null;

    const isAdmin = user?.roles?.includes('admin');

    const registered = registration.eventId === eventId ? registration.registered : null;
    useEffect(() => {
        let active = true;

        if (!user || !eventId) return;

        async function checkRegistration() {
            try {
                const data = await registrationsApi.getStatus(eventId);

                if (active) {
                    setRegistration({
                        eventId,
                        registered: Boolean(data?.registered),
                    });
                }
            } catch {
                if (active) {
                    setRegistration({
                        eventId,
                        registered: false,
                    });
                }
            }
        }

        checkRegistration();

        return () => {
            active = false;
        };
    }, [eventId, user]);

    function openAuth() {
        setIsAuthOpen(true);
    }

    function closeAuth() {
        setIsAuthOpen(false);
    }

    function toggleSidebar() {
        setIsSidebarOpen((prev) => !prev);
    }

    function closeSidebar() {
        setIsSidebarOpen(false);
    }

    return (
        <div className="app-layout">
            <Header user={user} onOpenAuth={openAuth} onToggleSidebar={toggleSidebar} />

            <main className="app-layout__main">
                <Outlet
                    context={{
                        registered,
                        setRegistered: (value) => {
                            setRegistration({
                                eventId,
                                registered: value,
                            });
                        },
                    }}
                />
            </main>

            <SideBar isOpen={isSidebarOpen} onClose={closeSidebar} isAdmin={isAdmin} eventId={eventId} isRegistered={registered === true} />

            <AuthPanel isOpen={isAuthOpen} onClose={closeAuth} onAuthenticated={setUser} />
        </div>
    );
}
