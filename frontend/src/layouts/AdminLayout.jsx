// src/layouts/AdminLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { ADMIN_MENU } from "../components/admin/adminMenu";
<<<<<<< HEAD
import { logoutSession } from "../api/authApi";

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}") || {};
    } catch {
        return {};
    }
};
=======
import { updateStaffAccount } from "../api/authApi";
import Modal from "../components/admin/Modal";
import "../assets/css/admin.css";
>>>>>>> origin/KhoiNguyen_QuanLyBanner

// Mục "Tổng quan" đứng đầu, các nhóm còn lại lấy từ ADMIN_MENU
const DASHBOARD_ITEM = {
    icon: "🏠",
    label: "Tổng quan",
    path: "/admin/dashboard", // chỉnh cho khớp route dashboard của bạn
};

// Gộp phẳng để tra tên trang cho breadcrumb
const FLAT_ITEMS = [DASHBOARD_ITEM, ...ADMIN_MENU.flatMap((s) => s.items)];

function AdminNavItem({ item, sidebarOpen, currentPath, onNavigate }) {
    const active = currentPath === item.path;

    return (
        <div
            style={{
                ...styles.navItem,
                background: active ? "#4f46e5" : "transparent",
                color: active ? "#fff" : "#cbd5e1",
                justifyContent: sidebarOpen ? "flex-start" : "center",
            }}
            onClick={() => onNavigate(item.path)}
            title={!sidebarOpen ? item.label : ""}
        >
            <span style={styles.navIcon}>{item.icon}</span>
            {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
        </div>
    );
}

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
<<<<<<< HEAD
    const user = getStoredUser();
=======
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
>>>>>>> origin/KhoiNguyen_QuanLyBanner
    const role = localStorage.getItem("role");

    // ── Cấu hình tài khoản admin ─────────────────────────
    const [accModalOpen, setAccModalOpen] = useState(false);
    const [accForm, setAccForm] = useState({ HoTen: "", TenDangNhap: "", MatKhau: "" });
    const [accSaving, setAccSaving] = useState(false);
    const [accError, setAccError] = useState("");

    const openAccountConfig = () => {
        setAccForm({ HoTen: user.HoTen ?? "", TenDangNhap: user.TenDangNhap ?? "", MatKhau: "" });
        setAccError("");
        setAccModalOpen(true);
    };

    const setAccField = (key, value) => setAccForm((f) => ({ ...f, [key]: value }));

    const handleSaveAccount = async () => {
        setAccSaving(true);
        setAccError("");
        const payload = {
            HoTen: accForm.HoTen,
            TenDangNhap: accForm.TenDangNhap,
        };
        if (accForm.MatKhau) payload.MatKhau = accForm.MatKhau;
        try {
            const res = await updateStaffAccount(payload);
            const updatedUser = res.data?.user;
            if (updatedUser) {
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
            setAccModalOpen(false);
            Swal.fire({
                icon: "success",
                title: "Đã cập nhật tài khoản",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            const res = err.response?.data;
            const firstErr = res?.errors ? Object.values(res.errors)[0]?.[0] : null;
            setAccError(firstErr || res?.message || "Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setAccSaving(false);
        }
    };

    const handleLogout = async () => {
        if (loggingOut) return;

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
            setLoggingOut(true);
            try {
                await logoutSession();
            } catch {
                // Vẫn xóa phiên cục bộ nếu token đã hết hạn hoặc mạng bị gián đoạn.
            } finally {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("role");
                navigate("/staff/login", { replace: true });
                setLoggingOut(false);
            }
        }
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
                            BUFFET <span style={styles.logoTag}>ADMIN</span>
                        </span>
                    )}
                </div>

                {/* Menu */}
                <nav style={styles.nav}>
                    <AdminNavItem
                        item={DASHBOARD_ITEM}
                        sidebarOpen={sidebarOpen}
                        currentPath={location.pathname}
                        onNavigate={navigate}
                    />

                    {ADMIN_MENU.map((section) => (
                        <div key={section.key} style={styles.navGroup}>
                            {sidebarOpen && (
                                <div style={styles.navGroupTitle}>{section.title}</div>
                            )}
                            {section.items.map((item) => (
                                <AdminNavItem
                                    key={item.path}
                                    item={item}
                                    sidebarOpen={sidebarOpen}
                                    currentPath={location.pathname}
                                    onNavigate={navigate}
                                />
                            ))}
                        </div>
                    ))}
                </nav>

                {/* User info ở dưới */}
                <div
                    style={{
                        ...styles.sidebarFooter,
                        justifyContent: sidebarOpen ? "space-between" : "center",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                        <div style={styles.avatar}>{user.HoTen?.charAt(0) || "?"}</div>
                        {sidebarOpen && (
                            <div style={{ overflow: "hidden" }}>
                                <div style={styles.footerName}>{user.HoTen}</div>
                                <div style={styles.footerRole}>{role}</div>
                            </div>
                        )}
                    </div>
                    {sidebarOpen && (
                        <button
                            type="button"
                            style={styles.btnAccountConfig}
                            onClick={openAccountConfig}
                            title="Cấu hình tài khoản admin"
                        >
                            ⚙️
                        </button>
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

                    <button
                        style={styles.btnLogout}
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        🚪 {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </button>
                </header>

                {/* Nội dung trang */}
                <div style={styles.content}>
                    <Outlet />
                </div>
            </div>

            {/* Modal cấu hình tài khoản admin */}
            <Modal
                open={accModalOpen}
                title="Cấu hình tài khoản admin"
                onClose={() => setAccModalOpen(false)}
                width={480}
                footer={
                    <>
                        <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => setAccModalOpen(false)}
                            disabled={accSaving}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            onClick={handleSaveAccount}
                            disabled={accSaving}
                        >
                            {accSaving ? "Đang lưu…" : "Lưu"}
                        </button>
                    </>
                }
            >
                {accError && <div className="admin-form-error">{accError}</div>}

                <div className="admin-form">
                    <div className="admin-field admin-field--full">
                        <label>Họ tên</label>
                        <input
                            className="admin-input"
                            value={accForm.HoTen}
                            onChange={(e) => setAccField("HoTen", e.target.value)}
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>Tên đăng nhập</label>
                        <input
                            className="admin-input"
                            value={accForm.TenDangNhap}
                            onChange={(e) => setAccField("TenDangNhap", e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>
                            Mật khẩu mới{" "}
                            <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                                (để trống nếu không đổi)
                            </span>
                        </label>
                        <input
                            type="password"
                            className="admin-input"
                            value={accForm.MatKhau}
                            onChange={(e) => setAccField("MatKhau", e.target.value)}
                            placeholder="Tối thiểu 6 ký tự"
                            autoComplete="new-password"
                        />
                    </div>
                </div>
            </Modal>
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
        color: "#c7d2fe",
        background: "#4f46e5",
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
        background: "#4f46e5",
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
    btnAccountConfig: {
        width: 28,
        height: 28,
        flexShrink: 0,
        border: "1px solid #334155",
        borderRadius: 8,
        background: "transparent",
        cursor: "pointer",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
