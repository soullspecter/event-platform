import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout/MainLayout.jsx';

import HomePage from '../pages/HomePage/HomePage.jsx';
import ProfilePage from '../pages/ProfilePage/ProfilePage.jsx';
import EventPage from '../pages/EventPage/EventPage.jsx';
import EventHistoryPage from '../pages/EventHistoryPage/EventHistoryPage.jsx';

import CreateEventPage from '../pages/admin/CreateEventPage/Layout/Layout.jsx';
import DraftsPage from '../pages/admin/CreateEventPage/Drafts/DraftsPage.jsx';
import QuestionnairesAdminPage from '../pages/admin/CreateEventPage/ProgramEditor/QuestionnairesEditor/QuestionnairesEditor.jsx';

import QuestionnairesPage from '../pages/QuestionnairesPage/QuestionnairesPage.jsx';

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
                    {/* Главная */}
                    <Route path="/" element={<HomePage />} />

                    {/* Создание события */}
                    <Route
                        path="/events/create"
                        element={
                            <AdminRoute>
                                <CreateEventPage />
                            </AdminRoute>
                        }
                    />

                    {/* Редактирование существующего события */}
                    <Route
                        path="/events/:id/edit"
                        element={
                            <AdminRoute>
                                <CreateEventPage />
                            </AdminRoute>
                        }
                    />

                    {/* Черновики */}
                    <Route
                        path="/events/drafts"
                        element={
                            <AdminRoute>
                                <DraftsPage />
                            </AdminRoute>
                        }
                    />

                    {/* Просмотр события */}
                    <Route path="/events/:id" element={<EventPage />} />

                    {/* История событий */}
                    <Route path="/events/history" element={<EventHistoryPage />} />

                    {/* Профиль */}
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Анкеты участника */}
                    <Route path="/events/:eventId/questionnaires" element={<QuestionnairesPage />} />

                    {/* Управление анкетами */}
                    <Route
                        path="/events/:eventId/questionnaires/manage"
                        element={
                            <AdminRoute>
                                <QuestionnairesAdminPage />
                            </AdminRoute>
                        }
                    />
                </Route>

                {/* Неизвестный маршрут */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
