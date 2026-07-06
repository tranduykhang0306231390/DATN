import { useState } from "react";
import { memberLogin } from "../../api/authApi";
import Swal from "sweetalert2";
import "../../assets/css/auth.css";
import { FaEye, FaEyeSlash, FaGift, FaPercent, FaStar, FaCrown, FaUtensils } from "react-icons/fa";

function LoginMember() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await memberLogin({
                email,
                password
            });

            localStorage.setItem(
                "token",
                response.data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            localStorage.setItem(
                "role",
                "member"
            );

            Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công",
                timer: 1500,
                showConfirmButton: false
            });

            window.location.href = "/member/home";

        } catch {
            Swal.fire({
                icon: "error",
                title: "Đăng nhập thất bại",
                text: "Email hoặc mật khẩu không chính xác"
            });
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-card">

                <div className="text-center">

                    <h1 className="restaurant-logo">
                        BUFFET VIP
                    </h1>

                    <p className="restaurant-subtitle">
                        Hệ thống thành viên thân thiết
                    </p>

                </div>

                {/* HÀNG TEM TÍCH ĐIỂM - đồng bộ với trang đăng ký */}
                <div className="stamp-trail">
                    <div className="stamp stamp-filled"><FaGift /></div>
                    <div className="stamp stamp-filled"><FaPercent /></div>
                    <div className="stamp stamp-filled"><FaStar /></div>
                    <div className="stamp stamp-locked"><FaUtensils /></div>
                    <div className="stamp stamp-locked"><FaCrown /></div>
                </div>

                <div className="ticket-divider">
                    <span className="ticket-notch left" />
                    <span className="ticket-notch right" />
                </div>

                <h2 className="auth-title">
                    Đăng nhập thành viên
                </h2>

                <form onSubmit={handleLogin}>

                    <div className="form-group">

                        <label className="form-label">
                            Email
                        </label>

                        <input
                            className="auth-input"
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label className="form-label">
                            Mật khẩu
                        </label>

                        <div className="password-box">
                            <input
                                className="auth-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                            <span
                                className="password-eye"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>

                    </div>

                    <button
                        className="auth-btn"
                        type="submit"
                    >
                        <FaGift /> Đăng nhập
                    </button>

                    <div className="text-center mt-4">

                        <span>
                            Chưa có tài khoản?
                        </span>

                        {/* ĐÃ SỬA: Thêm thẻ mở <a ở đây */}
                        <a
                            href="/register"
                            className="auth-link ms-2"
                        >
                            Đăng ký ngay
                        </a>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default LoginMember;