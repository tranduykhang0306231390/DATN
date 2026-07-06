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