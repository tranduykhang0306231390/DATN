import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaKey, FaSignOutAlt, FaUserEdit } from "react-icons/fa";
import { getBackendAssetUrl } from "../../../utils/apiUrl";
import { getAccountSearch } from "../../../utils/accountCenter";
import CustomerNavigation from "./CustomerNavigation";

const getInitials = (name) => {
    const parts = String(name || "Thành viên").trim().split(/\s+/).filter(Boolean);
    return parts.slice(-2).map((part) => part.charAt(0)).join("").toUpperCase();
};

function CustomerHeader({
    isAuthenticated = false,
    user = null,
    notificationSlot = null,
    onLogout,
    isLoggingOut = false,
}) {
    const location = useLocation();
    const headerRef = useRef(null);
    const menuButtonRef = useRef(null);
    const routeKey = `${location.pathname}${location.search}${location.hash}`;
    const [openMenuRoute, setOpenMenuRoute] = useState(null);
    const isMenuOpen = openMenuRoute === routeKey;
    const homePath = isAuthenticated ? "/member/rank" : "/";
    const rankName =
        user?.TenHang ||
        user?.hangThanhVien?.TenHang ||
        user?.hang_thanh_vien?.TenHang;
    const pointValue = Number(user?.TongDiem);
    const hasPoints =
        user?.TongDiem !== null &&
        user?.TongDiem !== undefined &&
        Number.isFinite(pointValue);

    useEffect(() => {
        if (!isMenuOpen) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                setOpenMenuRoute(null);
                menuButtonRef.current?.focus();
            }
        };
        const closeOnOutsideClick = (event) => {
            if (!headerRef.current?.contains(event.target)) {
                setOpenMenuRoute(null);
            }
        };

        document.addEventListener("keydown", closeOnEscape);
        document.addEventListener("pointerdown", closeOnOutsideClick);
        return () => {
            document.removeEventListener("keydown", closeOnEscape);
            document.removeEventListener("pointerdown", closeOnOutsideClick);
        };
    }, [isMenuOpen]);

    return (
        <header
            ref={headerRef}
            className={`customer-header ${isAuthenticated ? "customer-header--member" : ""}`.trim()}
        >
            <div
                className={`customer-shell customer-header__inner ${
                    isAuthenticated ? "customer-header__inner--member" : ""
                }`.trim()}
            >
                <Link
                    to={homePath}
                    className="customer-brand"
                    aria-label={isAuthenticated ? "Buffet - Trung tâm tài khoản" : "Buffet - Trang chủ"}
                >
                    <img
                        src={getBackendAssetUrl("logo/logo.png")}
                        alt=""
                        className="customer-brand__logo"
                    />
                    <span className="customer-brand__text">
                        <strong>BUFFET</strong>
                    </span>
                </Link>

                {!isAuthenticated && (
                    <div
                        id="customer-navigation-panel"
                        className={`customer-header__navigation ${isMenuOpen ? "is-open" : ""}`}
                    >
                        <CustomerNavigation
                            onNavigate={() => setOpenMenuRoute(null)}
                        />
                    </div>
                )}

                <div className="customer-header__actions">
                    {isAuthenticated ? (
                        <>
                            {notificationSlot}

                            {(hasPoints || rankName) && (
                                <div
                                    className={`customer-member-meta ${
                                        !hasPoints && rankName ? "customer-member-meta--rank-only" : ""
                                    }`.trim()}
                                    aria-label="Thông tin thành viên"
                                >
                                    {hasPoints && (
                                        <span>
                                            <strong>{pointValue.toLocaleString("vi-VN")}</strong>
                                            điểm
                                        </span>
                                    )}
                                    {rankName && <span className="customer-member-meta__rank">{rankName}</span>}
                                </div>
                            )}

                            <div className="customer-account-menu">
                                <button
                                    ref={menuButtonRef}
                                    type="button"
                                    className="customer-account-summary"
                                    title={user?.HoTen || "Thành viên"}
                                    aria-haspopup="menu"
                                    aria-expanded={isMenuOpen}
                                    aria-controls="customer-account-menu-panel"
                                    onClick={() => {
                                        setOpenMenuRoute((current) => current === routeKey ? null : routeKey);
                                    }}
                                >
                                    <span className="customer-account-summary__avatar" aria-hidden="true">
                                        {getInitials(user?.HoTen)}
                                    </span>
                                    <span className="customer-account-summary__name">
                                        {user?.HoTen || "Thành viên"}
                                    </span>
                                </button>

                                {isMenuOpen && (
                                    <div
                                        id="customer-account-menu-panel"
                                        className="customer-account-menu__panel"
                                        role="menu"
                                    >
                                        <Link
                                            to={`/member/rank${getAccountSearch({ tab: "rank", modal: "profile" })}`}
                                            role="menuitem"
                                            onClick={() => setOpenMenuRoute(null)}
                                        >
                                            <FaUserEdit aria-hidden="true" />
                                            Chỉnh sửa thông tin
                                        </Link>
                                        <Link
                                            to={`/member/rank${getAccountSearch({ tab: "rank", modal: "password" })}`}
                                            role="menuitem"
                                            onClick={() => setOpenMenuRoute(null)}
                                        >
                                            <FaKey aria-hidden="true" />
                                            Đổi mật khẩu
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                className="customer-button customer-button--secondary customer-header__logout"
                                onClick={onLogout}
                                disabled={isLoggingOut}
                            >
                                <FaSignOutAlt aria-hidden="true" />
                                <span>{isLoggingOut ? "Đang đăng xuất…" : "Đăng xuất"}</span>
                            </button>
                        </>
                    ) : (
                        <div className="customer-header__guest-actions">
                            <Link to="/login" className="customer-button customer-button--secondary">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="customer-button customer-button--primary">
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>

                {!isAuthenticated && (
                    <button
                        ref={menuButtonRef}
                        type="button"
                        className="customer-menu-toggle"
                        aria-expanded={isMenuOpen}
                        aria-controls="customer-navigation-panel"
                        aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                        onClick={() => {
                            setOpenMenuRoute((current) => current === routeKey ? null : routeKey);
                        }}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                )}
            </div>
        </header>
    );
}

export default CustomerHeader;
