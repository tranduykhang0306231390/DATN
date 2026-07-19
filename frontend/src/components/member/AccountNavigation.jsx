import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    FaCalendarCheck,
    FaCrown,
    FaGift,
    FaHistory,
    FaTicketAlt,
} from "react-icons/fa";
import "../../assets/css/customer/account-navigation.css";

const ACCOUNT_LINKS = [
    { key: "rank", to: "/member/rank?tab=rank", label: "Hạng và điểm", icon: FaCrown },
    { key: "tickets", to: "/member/rank?tab=tickets", label: "Giá vé", icon: FaTicketAlt },
    { key: "vouchers", to: "/member/rank?tab=vouchers", label: "Voucher", icon: FaGift },
    { key: "dat-ban", to: "/member/rank?tab=dat-ban", label: "Đặt bàn", icon: FaCalendarCheck },
    { key: "transactions", to: "/member/rank?tab=transactions", label: "Lịch sử giao dịch", icon: FaHistory },
];

function AccountNavigation({ activeKey = "rank" }) {
    const linksRef = useRef(null);

    useEffect(() => {
        if (!window.matchMedia?.("(max-width: 1024px)").matches) return;
        const container = linksRef.current;
        const activeLink = container?.querySelector(`[data-account-key="${activeKey}"]`);
        if (!container || !activeLink) return;

        const linkLeft = activeLink.offsetLeft;
        const linkRight = linkLeft + activeLink.offsetWidth;
        const visibleLeft = container.scrollLeft;
        const visibleRight = visibleLeft + container.clientWidth;

        if (linkLeft < visibleLeft) container.scrollLeft = Math.max(0, linkLeft - 12);
        else if (linkRight > visibleRight) container.scrollLeft = linkRight - container.clientWidth + 12;
    }, [activeKey]);

    return (
        <nav className="member-account-nav" aria-label="Điều hướng tài khoản">
            <p className="member-account-nav__label">Tài khoản của tôi</p>
            <div ref={linksRef} className="member-account-nav__links">
                {ACCOUNT_LINKS.map(({ key, to, label, icon: Icon }) => {
                    const isActive = key === activeKey;

                    return (
                        <Link
                            key={key}
                            to={to}
                            data-account-key={key}
                            className={`member-account-nav__link ${isActive ? "is-active" : ""}`}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <Icon aria-hidden="true" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export default AccountNavigation;
