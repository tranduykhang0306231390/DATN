// src/layouts/StaffLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { STAFF_MENU } from "../components/staff/staffMenu";

// Mục "Tổng quan" đứng đầu, các nhóm còn lại lấy từ STAFF_MENU
const DASHBOARD_ITEM = {
    icon: "🏠",
    label: "Tổng quan",
    path: "/staff/dashboard",
};

// Gộp phẳng để tra tên trang cho breadcrumb
const FLAT_ITEMS = [DASHBOARD_ITEM, ...STAFF_MENU.flatMap((s) => s.items)];

export default function StaffLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = localStorage.getItem("role");

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: "Đăng xuất?",
            text: "Bạn có chắc muốn đăng xuất không?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đăng xuất",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#dc2626",
        });
        if (result.isConfirmed) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
            navigate("/staff/login", { replace: true });
        }
    };

    const NavItem = ({ item }) => {
        const active = location.pathname === item.path;
        return (
            <div
                style={{
                    ...styles.navItem,
                    background: active ? "#3b82f6" : "transparent",
                    color: active ? "#fff" : "#cbd5e1",
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                }}
                onClick={() => navigate(item.path)}
                title={!sidebarOpen ? item.label : ""}
            >
                <span style={styles.navIcon}>{item.icon}</span>
                {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
            </div>
        );
    };

    return (
        <div style={styles.root}>
            {/* ── SIDEBAR ─────────────────────────────────── */}
            <aside style={{ ...styles.sidebar, width: sidebarOpen ? 240 : 60 }}>
                {/* Logo */}
                <div style={styles.sidebarLogo}>
                    <span style={styles.logoIcon}>🍽</span>
                    {sidebarOpen && (
                        <span style={styles.logoText}>
                            BUFFET <span style={styles.logoTag}>STAFF</span>
                        </span>
                    )}
                </div>

                {/* Menu */}
                <nav style={styles.nav}>
                    <NavItem item={DASHBOARD_ITEM} />

                    {STAFF_MENU.map((section) => (
                        <div key={section.key} style={styles.navGroup}>
                            {sidebarOpen && (
                                <div style={styles.navGroupTitle}>{section.title}</div>
                            )}
                            {section.items.map((item) => (
                                <NavItem key={item.path} item={item} />
                            ))}
                        </div>
                    ))}
                </nav>

                {/* User info ở dưới */}
                <div
                    style={{
                        ...styles.sidebarFooter,
                        justifyContent: sidebarOpen ? "flex-start" : "center",
                    }}
                >
                    <div style={styles.avatar}>{user.HoTen?.charAt(0) || "?"}</div>
                    {sidebarOpen && (
                        <div style={{ overflow: "hidden" }}>
                            <div style={styles.footerName}>{user.HoTen}</div>
                            <div style={styles.footerRole}>{role}</div>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── MAIN ────────────────────────────────────── */}
            <div style={styles.main}>
                {/* Header */}
                <header style={styles.header}>
                    <button
                        style={styles.btnToggle}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title="Ẩn/hiện menu"
                    >
                        {sidebarOpen ? "◀" : "▶"}
                    </button>

                    <div style={styles.pageName}>
                        {FLAT_ITEMS.find((m) => m.path === location.pathname)?.label ||
                            "Tổng quan"}
                    </div>

                    <button style={styles.btnLogout} onClick={handleLogout}>
                        🚪 Đăng xuất
                    </button>
                </header>

                {/* Nội dung trang */}
                <div style={styles.content}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

const styles = {
    root: {
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },

    // Sidebar
    sidebar: {
        background: "#1e293b",
        display: "flex",
        flexDirection: "column",
        transition: "width .25s ease",
        overflow: "hidden",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
    },
    sidebarLogo: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 16px",
        borderBottom: "1px solid #334155",
        minHeight: 64,
    },
    logoIcon: { fontSize: 22, flexShrink: 0 },
    logoText: {
        color: "#f8fafc",
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: 1,
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 6,
    },
    logoTag: {
        fontSize: 10,
        fontWeight: 700,
        color: "#dbeafe",
        background: "#3b82f6",
        padding: "2px 6px",
        borderRadius: 5,
        letterSpacing: 0.5,
    },
    nav: {
        flex: 1,
        padding: "12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflowY: "auto",
    },
    navGroup: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginTop: 10,
    },
    navGroupTitle: {
        color: "#64748b",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        padding: "4px 12px",
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        cursor: "pointer",
        transition: "background .15s",
        fontSize: 14,
        fontWeight: 500,
    },
    navIcon: { fontSize: 18, flexShrink: 0 },
    navLabel: { whiteSpace: "nowrap" },
    sidebarFooter: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 12px",
        borderTop: "1px solid #334155",
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#3b82f6",
        color: "#fff",
        fontWeight: 700,
        fontSize: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    footerName: {
        color: "#f1f5f9",
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    footerRole: {
        color: "#94a3b8",
        fontSize: 11,
        marginTop: 1,
    },

    // Main
    main: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "#f3f4f6",
    },
    header: {
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 14,
        position: "sticky",
        top: 0,
        zIndex: 10,
    },
    btnToggle: {
        width: 32,
        height: 32,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#f9fafb",
        cursor: "pointer",
        fontSize: 13,
        color: "#374151",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    pageName: {
        flex: 1,
        fontWeight: 600,
        fontSize: 15,
        color: "#111827",
    },
    btnLogout: {
        padding: "6px 14px",
        background: "#dc2626",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        flexShrink: 0,
    },
    content: {
        flex: 1,
        overflow: "auto",
    },
};