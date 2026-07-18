import { FaCrown, FaGift, FaStar, FaTicketAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

import CustomerLayout from "../layout/CustomerLayout";
import "../../../assets/css/customer/authentication.css";

const AUTH_BENEFITS = [
    { icon: FaStar, label: "Theo dõi điểm thưởng rõ ràng" },
    { icon: FaGift, label: "Đổi voucher theo quyền lợi thật" },
    { icon: FaCrown, label: "Khám phá hành trình thăng hạng" },
];

function CustomerAuthLayout({
    eyebrow,
    title,
    description,
    children,
    footer,
    compact = false,
}) {
    return (
        <CustomerLayout>
            <section className={`customer-auth ${compact ? "customer-auth--compact" : ""}`}>
                <span className="customer-auth__shape customer-auth__shape--purple" aria-hidden="true" />
                <span className="customer-auth__shape customer-auth__shape--cyan" aria-hidden="true" />

                <div className="customer-shell customer-auth__shell">
                    <aside className="customer-auth__story" aria-labelledby="customer-auth-story-title">
                        <div className="customer-auth__story-copy">
                            <span className="customer-auth__story-kicker">
                                <FaTicketAlt aria-hidden="true" />
                                Buffet VIP Rewards
                            </span>
                            <h2 id="customer-auth-story-title">
                                Mỗi lần ghé, một bước gần hơn đến ưu đãi
                            </h2>
                            <p>
                                Đăng nhập để quản lý điểm, voucher, hạng thành viên và lịch sử giao dịch trong một nơi.
                            </p>
                        </div>

                        <ul className="customer-auth__benefits">
                            {AUTH_BENEFITS.map(({ icon: Icon, label }) => (
                                <li key={label}>
                                    <span aria-hidden="true"><Icon /></span>
                                    {label}
                                </li>
                            ))}
                        </ul>

                        <div className="customer-auth__journey" aria-hidden="true">
                            <span><FaGift /></span>
                            <i />
                            <span><FaStar /></span>
                            <i />
                            <span><FaCrown /></span>
                        </div>
                    </aside>

                    <article className="customer-auth__panel" aria-labelledby="customer-auth-title">
                        <Link to="/" className="customer-auth__back-link">
                            <span aria-hidden="true">←</span> Về trang chủ
                        </Link>

                        <header className="customer-auth__heading">
                            <span>{eyebrow}</span>
                            <h1 id="customer-auth-title">{title}</h1>
                            {description && <p>{description}</p>}
                        </header>

                        {children}

                        {footer && <div className="customer-auth__footer">{footer}</div>}
                    </article>
                </div>
            </section>
        </CustomerLayout>
    );
}

function AuthMessage({ message, tone = "error" }) {
    if (!message) return null;

    return (
        <div
            className={`customer-auth__message customer-auth__message--${tone}`}
            role={tone === "error" ? "alert" : "status"}
            aria-live={tone === "error" ? "assertive" : "polite"}
        >
            {message}
        </div>
    );
}

export { AuthMessage };
export default CustomerAuthLayout;
