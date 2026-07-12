// src/pages/staff/StaffDashboard.jsx
import { useNavigate } from 'react-router-dom';
import '../../assets/css/staff.css';
import { STAFF_MENU } from '../../components/staff/staffMenu';

export default function StaffDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = localStorage.getItem('role') || 'Nhân viên';

    return (
        <div className="staff-page" style={{ padding: 24 }}>
            {/* Lời chào (đăng xuất nằm ở header của StaffLayout) */}
            <header style={s.hero}>
                <div>
                    <span style={s.eyebrow}>Bảng điều khiển nhân viên</span>
                    <h2 style={s.heroTitle}>Xin chào, {user.HoTen || 'Nhân viên'} 👋</h2>
                    <p style={s.heroSub}>Chọn chức năng bạn muốn thao tác.</p>
                </div>
                <span style={s.badge}>{role}</span>
            </header>

            {/* Các nhóm chức năng */}
            {STAFF_MENU.map((section) => (
                <section key={section.key} style={{ marginTop: 26 }}>
                    <div style={s.sectionEyebrow}>{section.eyebrow}</div>
                    <h3 style={s.sectionTitle}>{section.title}</h3>

                    <div style={s.grid}>
                        {section.items.map((item) => (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => navigate(item.path)}
                                style={s.card}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,.10)';
                                    e.currentTarget.style.borderColor = item.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                            >
                                <div style={{ ...s.cardIcon, background: `${item.color}1a`, color: item.color }}>
                                    {item.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={s.cardLabel}>{item.label}</div>
                                    <div style={s.cardDesc}>{item.desc}</div>
                                </div>
                                <span style={{ ...s.cardArrow, color: item.color }}>→</span>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

const s = {
    hero: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: 'linear-gradient(120deg,#1e293b,#334155)',
        borderRadius: 16,
        padding: '26px 28px',
        color: '#fff',
    },
    eyebrow: {
        fontSize: 12, fontWeight: 700, letterSpacing: 1,
        textTransform: 'uppercase', color: '#93c5fd',
    },
    heroTitle: { margin: '6px 0 4px', fontSize: 24, fontWeight: 800 },
    heroSub: { margin: 0, color: '#cbd5e1', fontSize: 14 },
    badge: {
        background: '#3b82f6', color: '#fff', fontWeight: 700,
        fontSize: 13, padding: '6px 14px', borderRadius: 999,
    },
    sectionEyebrow: {
        fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
        textTransform: 'uppercase', color: '#64748b',
    },
    sectionTitle: { margin: '2px 0 14px', fontSize: 18, fontWeight: 700, color: '#111827' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
    },
    card: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        textAlign: 'left',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: '18px 18px',
        cursor: 'pointer',
        transition: 'transform .15s, box-shadow .15s, border-color .15s',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        font: 'inherit',
    },
    cardIcon: {
        width: 46, height: 46, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
    },
    cardLabel: { fontWeight: 700, fontSize: 15, color: '#111827' },
    cardDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    cardArrow: { fontSize: 18, fontWeight: 700 },
};