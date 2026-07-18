import {
    FaCrown,
    FaGift,
    FaStar,
    FaTicketAlt,
} from "react-icons/fa";

import { Link } from "react-router-dom";

import { MemberLoginForm } from "../customer/auth";
import "../../assets/css/customer/authentication.css";

const PUBLIC_LOGIN_BENEFITS = [
    {
        icon: FaStar,
        label: "Theo dõi điểm thưởng sau từng giao dịch",
    },
    {
        icon: FaGift,
        label: "Đổi voucher phù hợp với số điểm hiện có",
    },
    {
        icon: FaCrown,
        label: "Xem hạng và tiến trình thăng hạng rõ ràng",
    },
];

function LoginSection() {
    return (
        <section
            id="dangnhap"
            className="customer-auth customer-public-auth"
            aria-labelledby="public-login-title"
        >
            <span
                className="customer-auth__shape customer-auth__shape--purple"
                aria-hidden="true"
            />

            <span
                className="customer-auth__shape customer-auth__shape--cyan"
                aria-hidden="true"
            />

            <div className="customer-shell customer-auth__shell customer-public-auth__shell">
                <aside
                    className="customer-auth__story"
                    aria-labelledby="public-login-story-title"
                >
                    <div className="customer-auth__story-copy">
                        <span className="customer-auth__story-kicker">
                            <FaTicketAlt aria-hidden="true" />
                            Buffet VIP Rewards
                        </span>

                        <h1 id="public-login-story-title">
                            Mỗi lần dùng bữa, một bước gần hơn đến ưu đãi
                        </h1>

                        <p>
                            Một tài khoản để theo dõi điểm, hạng thành viên,
                            voucher và toàn bộ lịch sử giao dịch của bạn.
                        </p>
                    </div>

                    <ul className="customer-auth__benefits">
                        {PUBLIC_LOGIN_BENEFITS.map(
                            ({ icon: Icon, label }) => (
                                <li key={label}>
                                    <span aria-hidden="true">
                                        <Icon />
                                    </span>

                                    {label}
                                </li>
                            ),
                        )}
                    </ul>

                    <div
                        className="customer-auth__journey"
                        aria-hidden="true"
                    >
                        <span>
                            <FaGift />
                        </span>

                        <i />

                        <span>
                            <FaStar />
                        </span>

                        <i />

                        <span>
                            <FaCrown />
                        </span>
                    </div>
                </aside>

                <article
                    className="customer-auth__panel"
                    aria-labelledby="public-login-title"
                >
                    <header className="customer-auth__heading">
                        <span>Chào mừng trở lại</span>

                        <h2 id="public-login-title">
                            Đăng nhập thành viên
                        </h2>

                        <p>
                            Đăng nhập để tiếp tục quản lý quyền lợi Buffet VIP
                            Rewards.
                        </p>
                    </header>

                    <MemberLoginForm idPrefix="public-member-login" />

                    <div className="customer-auth__footer">
                        Chưa có tài khoản?{" "}
                        <Link to="/register">Đăng ký thành viên</Link>
                    </div>
                </article>
            </div>
        </section>
    );
}

export default LoginSection;