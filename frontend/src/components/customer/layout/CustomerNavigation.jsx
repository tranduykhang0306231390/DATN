import { Link, useLocation } from "react-router-dom";

const MEMBER_LINKS = [
    {
        to: "/member/rank",
        label: "Trung tâm tài khoản",
    },
];

const GUEST_LINKS = [
    {
        href: "/",
        label: "Trang chủ",
    },
    {
        href: "/#gioithieu",
        label: "Giới thiệu",
    },
    {
        href: "/#quyenloi",
        label: "Quyền lợi",
    },
    {
        href: "/#footer",
        label: "Liên hệ",
    },
];

function CustomerNavigation({ onNavigate }) {
    const location = useLocation();

    return (
        <nav
            className="customer-navigation"
            aria-label="Điều hướng khách hàng"
        >
            <div className="customer-navigation__links">
                {GUEST_LINKS.map((item) => {
                    const [, targetHash = ""] = item.href.split("#");
                    const isAnchor = Boolean(targetHash);

                    const isActive =
                        location.pathname === "/" &&
                        (isAnchor
                            ? location.hash === `#${targetHash}`
                            : location.hash === "");

                    const className =
                        `customer-navigation__link ${
                            isActive ? "is-active" : ""
                        }`;

                    const ariaCurrent = isActive
                        ? isAnchor
                            ? "location"
                            : "page"
                        : undefined;

                    return isAnchor ? (
                        <a
                            key={item.href}
                            href={item.href}
                            className={className}
                            aria-current={ariaCurrent}
                            onClick={onNavigate}
                        >
                            {item.label}
                        </a>
                    ) : (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={className}
                            aria-current={ariaCurrent}
                            onClick={onNavigate}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            <div className="customer-navigation__mobile-actions">
                <Link
                    to="/login"
                    className="customer-button customer-button--secondary"
                    onClick={onNavigate}
                >
                    Đăng nhập
                </Link>

                <Link
                    to="/register"
                    className="customer-button customer-button--primary"
                    onClick={onNavigate}
                >
                    Đăng ký
                </Link>
            </div>
        </nav>
    );
}

export {
    GUEST_LINKS,
    MEMBER_LINKS,
};

export default CustomerNavigation;