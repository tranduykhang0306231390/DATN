import { useState } from "react";
import { forgotPassword } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function ForgotPassword() {

    const navigate = useNavigate();

    const [Email, setEmail] = useState("");
    const [SoDienThoai, setSoDienThoai] = useState("");
    const [NgaySinh, setNgaySinh] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await forgotPassword({
                Email,
                SoDienThoai,
                NgaySinh
            });

            Swal.fire({
                icon: "success",
                title: "Xác thực thành công",
                timer: 1500,
                showConfirmButton: false
            });

            navigate("/reset-password", {
                state: {
                    Email,
                    SoDienThoai,
                    NgaySinh
                }
            });

        } catch (err) {

            Swal.fire({
                icon: "error",
                title: "Xác thực thất bại",
                text: err.response?.data?.message
            });

        }

    };

    return (

        <div className="auth-container">

            <div className="auth-card">

                <h1 className="restaurant-logo">
                    BUFFET VIP
                </h1>

                <h2 className="auth-title">
                    Xác thực tài khoản
                </h2>

                <form onSubmit={handleSubmit}>

                    <input
                        className="auth-input"
                        placeholder="Email"
                        value={Email}
                        onChange={(e)=>setEmail(e.target.value)}
                    />

                    <input
                        className="auth-input mt-3"
                        placeholder="Số điện thoại"
                        value={SoDienThoai}
                        onChange={(e)=>setSoDienThoai(e.target.value)}
                    />

                    <input
                        type="date"
                        className="auth-input mt-3"
                        value={NgaySinh}
                        onChange={(e)=>setNgaySinh(e.target.value)}
                    />

                    <button
                        className="auth-btn mt-4"
                    >
                        Xác thực
                    </button>

                </form>

                <div className="text-center mt-3">

                    <a
                        href="/login"
                        className="auth-link"
                    >
                        Quay lại đăng nhập
                    </a>

                </div>

            </div>

        </div>

    );

}

export default ForgotPassword;