import { useState } from "react";
import { memberLogin } from "../../api/authApi";
import Swal from "sweetalert2";
import "../../assets/css/auth.css";

function LoginMember() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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

                <div className="text-center mb-4">

                    <h1 className="restaurant-logo">
                        BUFFET VIP
                    </h1>

                    <p className="restaurant-subtitle">
                        Hệ thống thành viên thân thiết
                    </p>

                </div>

                <h2 className="auth-title">
                    Member Login
                </h2>

                <form onSubmit={handleLogin}>

                    <div className="mb-3">

                        <label className="form-label">
                            Email
                        </label>

                        <input
                            className="form-control auth-input"
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                    </div>

                    <div className="mb-4">

                        <label className="form-label">
                            Mật khẩu
                        </label>

                        <input
                            className="form-control auth-input"
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                    </div>

                    <button
                        className="auth-btn"
                        type="submit"
                    >
                        Đăng nhập
                    </button>

                    <div className="text-center mt-4">

                        <span>
                            Chưa có tài khoản?
                        </span>

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