import { useEffect, useState } from 'react';
import { registrationsApi } from '../../../shared/api/eventsApi.js';
import './RegisterButton.scss';

export default function RegisterButton({ eventId }) {
    const [registered, setRegistered] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        registrationsApi
            .getStatus(eventId)
            .then((data) => {
                if (active) setRegistered(Boolean(data?.registered));
            })
            .catch((err) => {
                if (!active) return;
                if (/unauthorized|401/i.test(err.message)) return;
                setError(err.message || 'Не удалось получить статус регистрации');
            });

        return () => {
            active = false;
        };
    }, [eventId]);

    async function handleClick() {
        setBusy(true);
        setError('');
        try {
            if (registered) {
                await registrationsApi.unregister(eventId);
                setRegistered(false);
            } else {
                await registrationsApi.register(eventId);
                setRegistered(true);
            }
        } catch (err) {
            setError(err.message || 'Ошибка регистрации');
        } finally {
            setBusy(false);
        }
    }

    if (registered === null && !error) return null;

    return (
        <div className="register-button">
            {registered !== null && (
                <button type="button" className={`register-button__btn ${registered ? 'register-button__btn--cancel' : ''}`} onClick={handleClick} disabled={busy}>
                    {busy ? '...' : registered ? 'Отменить регистрацию' : 'Зарегистрироваться'}
                </button>
            )}
            {error && <p className="register-button__error">{error}</p>}
        </div>
    );
}
