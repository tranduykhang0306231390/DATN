// src/components/staff/StaffComponents.jsx
// Các component dùng chung cho trang staff
import { TRANG_THAI_CONFIG } from './staffUtils';

// ─── PageTitle ───────────────────────────────────────────────────────────────
export function PageTitle({ children }) {
    return <h2 className="staff-page-title">{children}</h2>;
}

// ─── StatCard ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, icon }) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: color }}>{icon}</div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}

// ─── Table helpers ───────────────────────────────────────────────────────────
export function Th({ children, align = 'left' }) {
    return <th style={{ textAlign: align }}>{children}</th>;
}

export function Td({ children, align = 'left', bold }) {
    return (
        <td style={{ textAlign: align, fontWeight: bold ? 600 : 400 }}>
            {children}
        </td>
    );
}

// ─── TrangThaiBadge ──────────────────────────────────────────────────────────
export function TrangThaiBadge({ trangThai }) {
    const cfg = TRANG_THAI_CONFIG[trangThai] || { badgeClass: 'badge', label: trangThai };
    return <span className={cfg.badgeClass}>{cfg.label}</span>;
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export function Pagination({ pagination, page, onPageChange }) {
    if (!pagination || pagination.last_page <= 1) return null;
    return (
        <div className="pagination-row">
            <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
            >‹ Trước</button>

            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
                <button
                    key={p}
                    className={`page-btn${p === page ? ' active' : ''}`}
                    onClick={() => onPageChange(p)}
                >{p}</button>
            ))}

            <button
                className="page-btn"
                disabled={page === pagination.last_page}
                onClick={() => onPageChange(page + 1)}
            >Sau ›</button>

            <span className="page-info">
                Trang {page}/{pagination.last_page} · {pagination.total} hóa đơn
            </span>
        </div>
    );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, children }) {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

// ─── InfoBlock (dùng trong modal chi tiết) ───────────────────────────────────
export function InfoBlock({ title, children }) {
    return (
        <div className="info-block">
            <div className="info-block-title">{title}</div>
            <div className="info-block-val">{children}</div>
        </div>
    );
}

// ─── SumRow (dòng tổng kết trong summary box) ────────────────────────────────
export function SumRow({ label, value, color, bold, accent }) {
    return (
        <div className="sum-row">
            <span style={{ color: '#6b7280' }}>{label}</span>
            <span style={{
                color:      accent ? '#b45309' : (color || '#111827'),
                fontWeight: bold || accent ? 700 : 400,
                fontSize:   accent ? 17 : 14,
            }}>{value}</span>
        </div>
    );
}

// ─── LoadingBox ──────────────────────────────────────────────────────────────
export function LoadingBox({ text = 'Đang tải...' }) {
    return <div className="loading-box">{text}</div>;
}

// ─── EmptyBox ────────────────────────────────────────────────────────────────
export function EmptyBox({ text = 'Không có dữ liệu' }) {
    return <div className="empty-box">{text}</div>;
}
