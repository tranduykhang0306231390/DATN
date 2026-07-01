import { useNavigate } from "react-router-dom";

const CARDS = [
    {
        icon: "🧾",
        label: "Tạo hóa đơn",
        desc: "Lập hóa đơn tại quầy cho khách",
        path: "/staff/tao-hoa-don",
        color: "#3b82f6",
    },
    {
        icon: "📋",
        label: "Quản lý hóa đơn",
        desc: "Xem và tra cứu lịch sử hóa đơn",
        path: "/staff/quan-ly-hoa-don",
        color: "#8b5cf6",
    },
];

export default function StaffDashboard() {
    const navigate = useNavigate();
    const user     = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div style={styles.page}>
            <h2 style={styles.welcome}>Xin chào, {user.HoTen || "Nhân viên"} 👋</h2>
            <p style={styles.sub}>Chọn chức năng bạn muốn thực hiện</p>

            <div style={styles.grid}>
                {CARDS.map((card) => (
                    <div
                        key={card.path}
                        style={styles.card}
                        onClick={() => navigate(card.path)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                        }}
                    >
                        <div style={{ ...styles.cardIconWrap, background: card.color }}>
                            {card.icon}
                        </div>
                        <div style={styles.cardLabel}>{card.label}</div>
                        <div style={styles.cardDesc}>{card.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    page:    { padding: "36px 32px" },
    welcome: { margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#111827" },
    sub:     { margin: "0 0 32px", color: "#6b7280", fontSize: 14 },
    grid:    { display: "flex", flexWrap: "wrap", gap: 20 },
    card: {
        width: 180,
        background: "#fff",
        borderRadius: 14,
        padding: "28px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "transform .2s, box-shadow .2s",
        textAlign: "center",
    },
    cardIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 14,
        fontSize: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 14px",
    },
    cardLabel: { fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6 },
    cardDesc:  { fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
};