import { useState } from "react";
import { registerMember } from "../../api/authApi";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../../assets/css/auth.css";

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        HoTen: "",
        NgaySinh: "",
        GioiTinh: "Nam",
        Email: "",
        SoDienThoai: "",
        MatKhau: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await registerMember(formData);

            Swal.fire({
                icon: "success",
                title: "Đăng ký thành công",
                timer: 1500,
                showConfirmButton: false
            });

            navigate("/login");

        } catch (error) {

            Swal.fire({
                icon: "error",
                title: "Đăng ký thất bại",
                text:
                    error.response?.data?.message ||
                    "Có lỗi xảy ra"
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
                    Member Registration
                </h2>

                <form onSubmit={handleSubmit}>

                    <div className="mb-3">
                        <label className="form-label">
                            Họ và tên
                        </label>

                        <input
                            className="form-control auth-input"
                            type="text"
                            name="HoTen"
                            placeholder="Nhập họ tên"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Ngày sinh
                        </label>

                        <input
                            className="form-control auth-input"
                            type="date"
                            name="NgaySinh"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Giới tính
                        </label>

                        <select
                            className="form-control auth-input"
                            name="GioiTinh"
                            onChange={handleChange}
                        >
                            <option value="Nam">Nam</option>
                            <option value="Nu">Nữ</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Email
                        </label>

                        <input
                            className="form-control auth-input"
                            type="email"
                            name="Email"
                            placeholder="Nhập email"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Số điện thoại
                        </label>

                        <input
                            className="form-control auth-input"
                            type="text"
                            name="SoDienThoai"
                            placeholder="Nhập số điện thoại"
                            onChange={handleChange}
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
                            name="MatKhau"
                            placeholder="Nhập mật khẩu"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        className="auth-btn"
                        type="submit"
                    >
                        Đăng ký
                    </button>

                    <div className="text-center mt-4">

                        <span>
                            Đã có tài khoản?
                        </span>

                        <a
                            href="/login"
                            className="auth-link ms-2"
                        >
                            Đăng nhập
                        </a>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default Register;