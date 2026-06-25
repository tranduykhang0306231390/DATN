import { useState } from "react";
import { staffLogin } from "../../api/authApi";
import Swal from "sweetalert2";
import "../../assets/css/auth.css";

function LoginStaff() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const response = await staffLogin({
                username,
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
                response.data.role
            );

            Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công",
                timer: 1500,
                showConfirmButton: false
            });

            if (response.data.role === "Admin") {

                window.location.href =
                    "/admin/dashboard";

            } else {

                window.location.href =
                    "/staff/dashboard";

            }

        } catch {

            Swal.fire({
                icon: "error",
                title: "Đăng nhập thất bại",
                text: "Sai tài khoản hoặc mật khẩu"
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
                        Staff Management System
                    </p>

                </div>

                <h2 className="auth-title">
                    Staff Login
                </h2>

                <form onSubmit={handleLogin}>

                    <div className="mb-3">

                        <label className="form-label">
                            Tên đăng nhập
                        </label>

                        <input
                            className="form-control auth-input"
                            type="text"
                            placeholder="Nhập tên đăng nhập"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
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

                </form>

            </div>

        </div>
    );
}

export default LoginStaff;