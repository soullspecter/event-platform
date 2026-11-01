import { Link, useLocation } from 'react-router-dom';
import { X, CalendarPlus, FileText } from 'lucide-react';

import './SideBar.scss';

export default function SideBar({ isOpen, onClose, isAdmin }) {
    const { pathname } = useLocation();

    const isDraftsActive = pathname.startsWith('/events/drafts');

    return (
        <>
            <div className={`sidebar-overlay${isOpen ? ' sidebar-overlay--visible' : ''}`} onClick={onClose} aria-hidden="true" />

            <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`} aria-label="Боковая панель" aria-hidden={!isOpen}>
                <div className="sidebar__header">
                    <h2 className="sidebar__title">Панель</h2>
                    <button className="sidebar__close" type="button" onClick={onClose} aria-label="Закрыть панель">
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                <div className="sidebar__content">
                    {isAdmin && (
                        <>
                            <Link to="/events/create" className="sidebar__action sidebar__action--primary" onClick={onClose}>
                                <CalendarPlus size={18} strokeWidth={2} />
                                <span>Создать мероприятие</span>
                            </Link>

                            <Link to="/events/drafts" className={`sidebar__action${isDraftsActive ? ' sidebar__action--active' : ''}`} onClick={onClose}>
                                <FileText size={18} strokeWidth={2} />
                                <span>Черновики</span>
                            </Link>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}
