import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout/MainLayout.jsx';
import HomePage from '../pages/HomePage/HomePage.jsx';
import ProfilePage from '../pages/ProfilePage/ProfilePage.jsx';
import EventPage from '../pages/EventPage/EventPage.jsx';
import CreateEventPage from '../pages/admin/CreateEventPage/Layout/Layout.jsx';
import DraftsPage from '../pages/admin/CreateEventPage/Drafts/DraftsPage.jsx';
import { authApi } from '../shared/api/auth.api.js';

function AdminRoute({ children }) {
    const user = authApi.getUser();

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (!user.roles?.includes('admin')) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />

                    <Route
                        path="/events/create"
                        element={
                            <AdminRoute>
                                <CreateEventPage />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="/events/drafts"
                        element={
                            <AdminRoute>
                                <DraftsPage />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="/events/:id/edit"
                        element={
                            <AdminRoute>
                                <CreateEventPage />
                            </AdminRoute>
                        }
                    />

                    <Route path="/events/:id" element={<EventPage />} />

                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
