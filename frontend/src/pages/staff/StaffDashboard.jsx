// src/pages/staff/StaffDashboard.jsx
import { useNavigate } from 'react-router-dom';
import '../../assets/css/staff.css';

const CARDS = [
    {
        icon: '🧾',
        label: 'trang chủ',
        desc: 'Trang tổng quan của nhân viên',
        path: '/staff/dashboard',
        color: '#3b82f6',
    },
    {
        icon: '🧾',
        label: 'Tạo hóa đơn',
        desc: 'Lập hóa đơn tại quầy cho khách',
        path: '/staff/tao-hoa-don',
        color: '#3b82f6',
    },
    {
        icon: '📋',
        label: 'Quản lý hóa đơn',
        desc: 'Xem và tra cứu lịch sử hóa đơn',
        path: '/staff/quan-ly-hoa-don',
        color: '#8b5cf6',
    },
];

export default function StaffDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="staff-page">
            <h2 className="staff-page-title">
                Xin chào, {user.HoTen || 'Nhân viên'} 👋
            </h2>
            <p style={{ margin: '0 0 32px', color: '#6b7280', fontSize: 14 }}>
                Chọn chức năng bạn muốn thực hiện
            </p>

            <div className="dashboard-grid">
                {CARDS.map((card) => (
                    <div
                        key={card.path}
                        className="dashboard-card"
                        onClick={() => navigate(card.path)}
                    >
                        <div
                            className="dashboard-card-icon"
                            style={{ background: card.color }}
                        >
                            {card.icon}
                        </div>
                        <div className="dashboard-card-label">{card.label}</div>
                        <div className="dashboard-card-desc">{card.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}