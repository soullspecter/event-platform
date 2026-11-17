import { useState } from 'react';
import '../BasicInfo/BasicInfoEditor.scss';

export default function ImportDocumentButton({ onImported }) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/drafts/from-document', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка при создании черновика');
            }

            const data = await response.json();

            if (onImported) {
                onImported(data.eventId);
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка: ' + error.message);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    return (
        <div className="import-document">
            <label
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    padding: '10px 16px',
                    background: isUploading ? '#e0e0e0' : '#f2eaff',
                    color: isUploading ? '#888' : 'var(--color-primary)',
                    border: '1px dashed #d8c9ed',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s',
                }}
            >
                <input type="file" accept=".doc,.docx,.md" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                <span>{isUploading ? '🤖 ИИ анализирует документ (это может занять пару минут)...' : '✨ Загрузить положение (ИИ)'}</span>
            </label>
        </div>
    );
}
