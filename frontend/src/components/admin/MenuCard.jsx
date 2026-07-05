// src/components/admin/MenuCard.jsx
import { useNavigate } from 'react-router-dom';

/**
 * Ô chức năng trong dashboard admin.
 * Dùng thẻ <button> để có thể điều hướng bằng bàn phím (Tab + Enter).
 */
export default function MenuCard({ icon, label, desc, path, color = '#4f46e5' }) {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            className="admin-card"
            style={{ '--card-accent': color }}
            onClick={() => navigate(path)}
        >
            <span className="admin-card-icon" aria-hidden="true">
                {icon}
            </span>

            <span className="admin-card-body">
                <span className="admin-card-label">{label}</span>
                <span className="admin-card-desc">{desc}</span>
            </span>

            <span className="admin-card-arrow" aria-hidden="true">
                →
            </span>
        </button>
    );
}