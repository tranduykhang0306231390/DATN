// src/components/admin/Modal.jsx
import { useEffect } from 'react';

/**
 * Modal dùng chung cho khu vực admin.
 * props: open, title, onClose, children, footer, width
 */
export default function Modal({ open, title, onClose, children, footer, width = 560 }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div
                className="admin-modal"
                style={{ maxWidth: width }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="admin-modal-head">
                    <h3 className="admin-modal-title">{title}</h3>
                    <button
                        type="button"
                        className="admin-modal-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="admin-modal-body">{children}</div>

                {footer && <div className="admin-modal-foot">{footer}</div>}
            </div>
        </div>
    );
}