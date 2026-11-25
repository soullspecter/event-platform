import { useState } from 'react';
import { registrationsApi } from '../../../../shared/api/eventsApi.js';
import './RegisterButton.scss';

export default function RegisterButton({ eventId, registered, onRegistrationChange }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function handleClick() {
        setBusy(true);
        setError('');

        try {
            if (registered) {
                await registrationsApi.unregister(eventId);
                onRegistrationChange?.(false);
            } else {
                await registrationsApi.register(eventId);
                onRegistrationChange?.(true);
            }
        } catch (err) {
            setError(err.message || 'Ошибка регистрации');
        } finally {
            setBusy(false);
        }
    }

    if (registered === null) return null;

    return (
        <div className="register-button">
            <button type="button" className={`register-button__btn ${registered ? 'register-button__btn--cancel' : ''}`} onClick={handleClick} disabled={busy}>
                {busy ? '...' : registered ? 'Отменить регистрацию' : 'Зарегистрироваться'}
            </button>

            {error && <p className="register-button__error">{error}</p>}
        </div>
    );
}
