// src/layouts/AdminLayout.jsx

import { useState } from "react";
import {
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";

import {
    logoutSession,
    updateStaffAccount,
} from "../api/authApi";

import { ADMIN_MENU } from "../components/admin/adminMenu";
import Modal from "../components/admin/Modal";

import "../assets/css/admin.css";

/*
|--------------------------------------------------------------------------
| Local storage helpers
|--------------------------------------------------------------------------
*/

const getStoredUser = () => {
    try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            return {};
        }

        const parsedUser = JSON.parse(storedUser);

        return parsedUser && typeof parsedUser === "object"
            ? parsedUser
            : {};
    } catch {
        return {};
    }
};

/*
|--------------------------------------------------------------------------
| Menu
|--------------------------------------------------------------------------
*/

const DASHBOARD_ITEM = {
    icon: "🏠",
    label: "Tổng quan",
    path: "/admin/dashboard",
};

const FLAT_ITEMS = [
    DASHBOARD_ITEM,
    ...ADMIN_MENU.flatMap((section) => section.items),
];

function isPathActive(currentPath, itemPath) {
    if (currentPath === itemPath) {
        return true;
    }

    /*
     * Hỗ trợ các trang con như:
     * /admin/nhan-vien/NV001
     *
     * Riêng dashboard chỉ active khi đúng chính xác route.
     */
    if (itemPath === DASHBOARD_ITEM.path) {
        return false;
    }

    return currentPath.startsWith(`${itemPath}/`);
}

function AdminNavItem({
    item,
    sidebarOpen,
    currentPath,
    onNavigate,
}) {
    const active = isPathActive(
        currentPath,
        item.path
    );

    const handleNavigate = () => {
        if (typeof onNavigate === "function") {
            onNavigate(item.path);
        }
    };

    return (
        <button
            type="button"
            style={{
                ...styles.navItem,

                background:
                    active
                        ? "#4f46e5"
                        : "transparent",

                color:
                    active
                        ? "#ffffff"
                        : "#cbd5e1",

                justifyContent:
                    sidebarOpen
                        ? "flex-start"
                        : "center",
            }}
            onClick={handleNavigate}
            title={!sidebarOpen ? item.label : ""}
            aria-current={active ? "page" : undefined}
        >
            <span
                style={styles.navIcon}
                aria-hidden="true"
            >
                {item.icon}
            </span>

            {sidebarOpen && (
                <span style={styles.navLabel}>
                    {item.label}
                </span>
            )}
        </button>
    );
}

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] =
        useState(true);

    const [loggingOut, setLoggingOut] =
        useState(false);

    const [user, setUser] =
        useState(getStoredUser);

    const role =
        localStorage.getItem("role") || "Admin";

    /*
    |--------------------------------------------------------------------------
    | Cấu hình tài khoản Admin
    |--------------------------------------------------------------------------
    */

    const [accModalOpen, setAccModalOpen] =
        useState(false);

    const [accForm, setAccForm] = useState({
        HoTen: "",
        TenDangNhap: "",
        MatKhau: "",
    });

    const [accSaving, setAccSaving] =
        useState(false);

    const [accError, setAccError] =
        useState("");

    const currentPage =
        FLAT_ITEMS.find((item) =>
            isPathActive(
                location.pathname,
                item.path
            )
        );

    const openAccountConfig = () => {
        setAccForm({
            HoTen: user.HoTen ?? "",
            TenDangNhap:
                user.TenDangNhap ?? "",
            MatKhau: "",
        });

        setAccError("");
        setAccModalOpen(true);
    };

    const closeAccountConfig = () => {
        if (accSaving) {
            return;
        }

        setAccModalOpen(false);
        setAccError("");

        setAccForm((current) => ({
            ...current,
            MatKhau: "",
        }));
    };

    const setAccField = (field, value) => {
        setAccForm((current) => ({
            ...current,
            [field]: value,
        }));

        setAccError("");
    };

    const validateAccountForm = () => {
        const hoTen =
            accForm.HoTen.trim();

        const tenDangNhap =
            accForm.TenDangNhap.trim();

        if (!hoTen) {
            return "Vui lòng nhập họ tên Admin.";
        }

        if (hoTen.length > 100) {
            return "Họ tên không được vượt quá 100 ký tự.";
        }

        if (!tenDangNhap) {
            return "Vui lòng nhập tên đăng nhập.";
        }

        if (tenDangNhap.length > 50) {
            return "Tên đăng nhập không được vượt quá 50 ký tự.";
        }

        if (
            accForm.MatKhau
            && accForm.MatKhau.length < 8
        ) {
            return "Mật khẩu mới phải có ít nhất 8 ký tự.";
        }

        if (
            accForm.MatKhau
            && accForm.MatKhau.length > 72
        ) {
            return "Mật khẩu mới không được vượt quá 72 ký tự.";
        }

        return "";
    };

    const handleSaveAccount = async () => {
        if (accSaving) {
            return;
        }

        const validationMessage =
            validateAccountForm();

        if (validationMessage) {
            setAccError(validationMessage);
            return;
        }

        const payload = {
            HoTen: accForm.HoTen.trim(),

            TenDangNhap:
                accForm.TenDangNhap.trim(),
        };

        if (accForm.MatKhau) {
            payload.MatKhau =
                accForm.MatKhau;
        }

        setAccSaving(true);
        setAccError("");

        try {
            const response =
                await updateStaffAccount(
                    payload
                );

            /*
             * Hỗ trợ cả hai response:
             * { user: {...} }
             * và
             * { data: {...} }
             */
            const updatedUser =
                response.data?.user
                ?? response.data?.data
                ?? null;

            if (updatedUser) {
                const mergedUser = {
                    ...user,
                    ...updatedUser,
                };

                localStorage.setItem(
                    "user",
                    JSON.stringify(mergedUser)
                );

                setUser(mergedUser);
            } else {
                /*
                 * Trong trường hợp API chỉ trả message,
                 * vẫn cập nhật các field đã chỉnh sửa.
                 */
                const mergedUser = {
                    ...user,
                    HoTen: payload.HoTen,
                    TenDangNhap:
                        payload.TenDangNhap,
                };

                localStorage.setItem(
                    "user",
                    JSON.stringify(mergedUser)
                );

                setUser(mergedUser);
            }

            setAccModalOpen(false);

            setAccForm({
                HoTen: "",
                TenDangNhap: "",
                MatKhau: "",
            });

            await Swal.fire({
                icon: "success",
                title:
                    "Đã cập nhật tài khoản",
                text:
                    "Thông tin tài khoản Admin đã được lưu.",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            const responseData =
                error.response?.data;

            const fieldErrors =
                responseData?.errors;

            const firstFieldError =
                fieldErrors
                    ? Object.values(
                          fieldErrors
                      ).flat()[0]
                    : null;

            setAccError(
                firstFieldError
                || responseData?.message
                || "Không thể cập nhật tài khoản. Vui lòng thử lại."
            );
        } finally {
            setAccSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Đăng xuất
    |--------------------------------------------------------------------------
    */

    const handleLogout = async () => {
        if (loggingOut) {
            return;
        }

        const result = await Swal.fire({
            title: "Đăng xuất?",
            text:
                "Bạn có chắc muốn đăng xuất khỏi hệ thống không?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đăng xuất",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#dc2626",
        });

        if (!result.isConfirmed) {
            return;
        }

        setLoggingOut(true);

        try {
            await logoutSession();
        } catch {
            /*
             * Vẫn xóa phiên cục bộ nếu:
             * - token đã hết hạn;
             * - server không phản hồi;
             * - kết nối mạng bị gián đoạn.
             */
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");

            navigate(
                "/staff/login",
                {
                    replace: true,
                }
            );

            setLoggingOut(false);
        }
    };

    return (
        <div style={styles.root}>
            {/* Sidebar */}
            <aside
                style={{
                    ...styles.sidebar,

                    width:
                        sidebarOpen
                            ? 240
                            : 60,
                }}
            >
                {/* Logo */}
                <div style={styles.sidebarLogo}>
                    <span
                        style={styles.logoIcon}
                        aria-hidden="true"
                    >
                        🍽
                    </span>

                    {sidebarOpen && (
                        <span style={styles.logoText}>
                            BUFFET

                            <span
                                style={styles.logoTag}
                            >
                                ADMIN
                            </span>
                        </span>
                    )}
                </div>

                {/* Menu */}
                <nav
                    style={styles.nav}
                    aria-label="Điều hướng quản trị"
                >
                    <AdminNavItem
                        item={DASHBOARD_ITEM}
                        sidebarOpen={sidebarOpen}
                        currentPath={
                            location.pathname
                        }
                        onNavigate={navigate}
                    />

                    {ADMIN_MENU.map(
                        (section) => (
                            <div
                                key={section.key}
                                style={
                                    styles.navGroup
                                }
                            >
                                {sidebarOpen && (
                                    <div
                                        style={
                                            styles.navGroupTitle
                                        }
                                    >
                                        {
                                            section.title
                                        }
                                    </div>
                                )}

                                {section.items.map(
                                    (item) => (
                                        <AdminNavItem
                                            key={
                                                item.path
                                            }
                                            item={
                                                item
                                            }
                                            sidebarOpen={
                                                sidebarOpen
                                            }
                                            currentPath={
                                                location.pathname
                                            }
                                            onNavigate={
                                                navigate
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )
                    )}
                </nav>

                {/* Thông tin tài khoản Admin */}
                <div
                    style={{
                        ...styles.sidebarFooter,

                        justifyContent:
                            sidebarOpen
                                ? "space-between"
                                : "center",
                    }}
                >
                    <div
                        style={
                            styles.accountSummary
                        }
                    >
                        <div
                            style={styles.avatar}
                            aria-hidden="true"
                        >
                            {user.HoTen
                                ?.trim()
                                .charAt(0)
                                .toUpperCase()
                                || "A"}
                        </div>

                        {sidebarOpen && (
                            <div
                                style={
                                    styles.accountText
                                }
                            >
                                <div
                                    style={
                                        styles.footerName
                                    }
                                    title={
                                        user.HoTen
                                        || "Admin"
                                    }
                                >
                                    {user.HoTen
                                        || "Quản trị viên"}
                                </div>

                                <div
                                    style={
                                        styles.footerRole
                                    }
                                >
                                    {role}
                                </div>
                            </div>
                        )}
                    </div>

                    {sidebarOpen && (
                        <button
                            type="button"
                            style={
                                styles.btnAccountConfig
                            }
                            onClick={
                                openAccountConfig
                            }
                            title="Cấu hình tài khoản Admin"
                            aria-label="Cấu hình tài khoản Admin"
                        >
                            ⚙️
                        </button>
                    )}
                </div>
            </aside>

            {/* Main */}
            <div style={styles.main}>
                <header style={styles.header}>
                    <button
                        type="button"
                        style={styles.btnToggle}
                        onClick={() =>
                            setSidebarOpen(
                                (current) =>
                                    !current
                            )
                        }
                        title={
                            sidebarOpen
                                ? "Thu gọn menu"
                                : "Mở rộng menu"
                        }
                        aria-label={
                            sidebarOpen
                                ? "Thu gọn menu"
                                : "Mở rộng menu"
                        }
                    >
                        {sidebarOpen
                            ? "◀"
                            : "▶"}
                    </button>

                    <div style={styles.pageName}>
                        {currentPage?.label
                            || "Tổng quan"}
                    </div>

                    <button
                        type="button"
                        style={{
                            ...styles.btnLogout,

                            opacity:
                                loggingOut
                                    ? 0.7
                                    : 1,

                            cursor:
                                loggingOut
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        🚪{" "}

                        {loggingOut
                            ? "Đang đăng xuất..."
                            : "Đăng xuất"}
                    </button>
                </header>

                <main style={styles.content}>
                    <Outlet />
                </main>
            </div>

            {/* Modal cấu hình tài khoản */}
            <Modal
                open={accModalOpen}
                title="Cấu hình tài khoản Admin"
                onClose={closeAccountConfig}
                width={480}
                footer={
                    <>
                        <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={
                                closeAccountConfig
                            }
                            disabled={accSaving}
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            onClick={
                                handleSaveAccount
                            }
                            disabled={accSaving}
                        >
                            {accSaving
                                ? "Đang lưu…"
                                : "Lưu thay đổi"}
                        </button>
                    </>
                }
            >
                {accError && (
                    <div
                        className="admin-form-error"
                        role="alert"
                    >
                        {accError}
                    </div>
                )}

                <div className="admin-form">
                    <div className="admin-field admin-field--full">
                        <label
                            htmlFor="admin-account-full-name"
                        >
                            Họ tên
                        </label>

                        <input
                            id="admin-account-full-name"
                            className="admin-input"
                            value={accForm.HoTen}
                            onChange={(event) =>
                                setAccField(
                                    "HoTen",
                                    event.target.value
                                )
                            }
                            maxLength={100}
                            autoComplete="name"
                            disabled={accSaving}
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label
                            htmlFor="admin-account-username"
                        >
                            Tên đăng nhập
                        </label>

                        <input
                            id="admin-account-username"
                            className="admin-input"
                            value={
                                accForm.TenDangNhap
                            }
                            onChange={(event) =>
                                setAccField(
                                    "TenDangNhap",
                                    event.target.value
                                )
                            }
                            maxLength={50}
                            autoComplete="username"
                            disabled={accSaving}
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label
                            htmlFor="admin-account-password"
                        >
                            Mật khẩu mới{" "}

                            <span
                                style={
                                    styles.optionalText
                                }
                            >
                                (để trống nếu không đổi)
                            </span>
                        </label>

                        <input
                            id="admin-account-password"
                            type="password"
                            className="admin-input"
                            value={accForm.MatKhau}
                            onChange={(event) =>
                                setAccField(
                                    "MatKhau",
                                    event.target.value
                                )
                            }
                            placeholder="Tối thiểu 8 ký tự"
                            minLength={8}
                            maxLength={72}
                            autoComplete="new-password"
                            disabled={accSaving}
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
        fontFamily:
            "'Inter', 'Segoe UI', sans-serif",
    },

    /*
    |--------------------------------------------------------------------------
    | Sidebar
    |--------------------------------------------------------------------------
    */

    sidebar: {
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
        background: "#1e293b",
        transition: "width 0.25s ease",
    },

    sidebarLogo: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 64,
        padding: "20px 16px",
        borderBottom:
            "1px solid #334155",
    },

    logoIcon: {
        flexShrink: 0,
        fontSize: 22,
    },

    logoText: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: 1,
        whiteSpace: "nowrap",
    },

    logoTag: {
        padding: "2px 6px",
        borderRadius: 5,
        background: "#4f46e5",
        color: "#c7d2fe",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
    },

    nav: {
        display: "flex",
        flex: 1,
        flexDirection: "column",
        gap: 4,
        overflowY: "auto",
        padding: "12px 8px",
    },

    navGroup: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginTop: 10,
    },

    navGroupTitle: {
        padding: "4px 12px",
        color: "#64748b",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },

    navItem: {
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: 10,
        padding: "10px 12px",
        border: "none",
        borderRadius: 8,
        background: "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 500,
        textAlign: "left",
        transition:
            "background 0.15s ease",
    },

    navIcon: {
        flexShrink: 0,
        fontSize: 18,
    },

    navLabel: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    sidebarFooter: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 64,
        padding: "12px",
        borderTop:
            "1px solid #334155",
    },

    accountSummary: {
        display: "flex",
        minWidth: 0,
        alignItems: "center",
        gap: 10,
        overflow: "hidden",
    },

    accountText: {
        minWidth: 0,
        overflow: "hidden",
    },

    avatar: {
        display: "flex",
        width: 34,
        height: 34,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "#4f46e5",
        color: "#ffffff",
        fontSize: 15,
        fontWeight: 700,
    },

    footerName: {
        overflow: "hidden",
        color: "#f1f5f9",
        fontSize: 13,
        fontWeight: 600,
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    footerRole: {
        marginTop: 1,
        color: "#94a3b8",
        fontSize: 11,
    },

    btnAccountConfig: {
        display: "flex",
        width: 30,
        height: 30,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        border:
            "1px solid #475569",
        borderRadius: 8,
        background: "transparent",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: 13,
    },

    /*
    |--------------------------------------------------------------------------
    | Main
    |--------------------------------------------------------------------------
    */

    main: {
        display: "flex",
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        background: "#f3f4f6",
    },

    header: {
        display: "flex",
        zIndex: 10,
        height: 56,
        flexShrink: 0,
        alignItems: "center",
        gap: 14,
        position: "sticky",
        top: 0,
        padding: "0 20px",
        borderBottom:
            "1px solid #e5e7eb",
        background: "#ffffff",
    },

    btnToggle: {
        display: "flex",
        width: 32,
        height: 32,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        border:
            "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#f9fafb",
        color: "#374151",
        cursor: "pointer",
        fontSize: 13,
    },

    pageName: {
        flex: 1,
        color: "#111827",
        fontSize: 15,
        fontWeight: 600,
    },

    btnLogout: {
        flexShrink: 0,
        padding: "7px 14px",
        border: "none",
        borderRadius: 8,
        background: "#dc2626",
        color: "#ffffff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 600,
    },

    content: {
        flex: 1,
        minWidth: 0,
        overflow: "auto",
    },

    optionalText: {
        color: "#94a3b8",
        fontWeight: 400,
    },
};