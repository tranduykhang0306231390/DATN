// src/pages/admin/AdminDashboard.jsx
import '../../assets/css/admin.css';
import { ADMIN_MENU } from '../../components/admin/adminMenu';
import DashboardSection from '../../components/admin/DashboardSection';
import { getStoredObject } from '../../utils/storage';

export default function AdminDashboard() {
    const user = getStoredObject('user');
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
