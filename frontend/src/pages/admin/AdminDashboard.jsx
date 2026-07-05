// src/pages/admin/AdminDashboard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/admin.css';
import { ADMIN_MENU } from '../../components/admin/adminMenu';
import DashboardSection from '../../components/admin/DashboardSection';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [dangDangXuat, setDangDangXuat] = useState(false);

    const handleLogout = () => {
        if (dangDangXuat) return;
        if (!window.confirm('Đăng xuất khỏi tài khoản?')) return;

        setDangDangXuat(true);
        // Đăng xuất thuần phía client: xóa phiên và quay về trang đăng nhập.
        // Khi bạn muốn hủy token phía server, có thể gọi thêm axiosClient.post('/logout').
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        navigate('/staff/login', { replace: true });
    };

    return (
        <div className="admin-page">
            {/* Lời chào */}
            <header className="admin-hero">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Bảng điều khiển quản trị</span>
                    <h2 className="admin-hero-title">
                        Xin chào, {user.HoTen || 'Quản trị viên'} 👋
                    </h2>
                    <p className="admin-hero-sub">
                        Chọn chức năng bạn muốn thao tác.
                    </p>
                </div>

                <div className="admin-hero-actions">
                    <span className="admin-hero-badge">{user.VaiTro || 'Admin'}</span>
                    <button
                        type="button"
                        className="admin-logout-btn"
                        onClick={handleLogout}
                        disabled={dangDangXuat}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        {dangDangXuat ? 'Đang thoát…' : 'Đăng xuất'}
                    </button>
                </div>
            </header>

            {/* Các nhóm chức năng */}
            {ADMIN_MENU.map((section) => (
                <DashboardSection
                    key={section.key}
                    eyebrow={section.eyebrow}
                    title={section.title}
                    items={section.items}
                />
            ))}
        </div>
    );
}