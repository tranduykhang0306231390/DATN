import { useState } from "react";
import { registerMember } from "../../api/authApi";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../../assets/css/auth.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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

    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getPasswordStrength = (password) => {
        let score = 0;

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[@$!%*#?&]/.test(password)) score++;

        if (score <= 2)
            return { text: "Yếu", color: "#dc3545", width: "33%" };

        if (score <= 4)
            return { text: "Trung bình", color: "#ffc107", width: "66%" };

        return { text: "Mạnh", color: "#198754", width: "100%" };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.MatKhau !== confirmPassword) {
            Swal.fire({
                icon: "warning",
                title: "Mật khẩu xác nhận không khớp"
            });
            return;
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,20}$/;

        if (!passwordRegex.test(formData.MatKhau)) {
            Swal.fire({
                icon: "warning",
                title: "Mật khẩu chưa đủ mạnh",
                text: "8-20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
            });
            return;
        }

        try {
            await registerMember({
                ...formData,
                MatKhau_confirmation: confirmPassword
            });

            Swal.fire({
                icon: "success",
                title: "Đăng ký thành công",
                timer: 1500,
                showConfirmButton: false
            });

            navigate("/member/login");

        } catch (error) {
            let message = "Có lỗi xảy ra";

            if (error.response?.data?.errors) {
                message = Object.values(error.response.data.errors)[0][0];
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            }

            Swal.fire({
                icon: "error",
                title: "Đăng ký thất bại",
                text: message
            });
        }
    };

    const strength = getPasswordStrength(formData.MatKhau);

    return (
        <div className="auth-container">

            <div className="auth-card">

                {/* HEADER */}
                <div className="text-center">
                    <h1 className="restaurant-logo">BUFFET VIP</h1>
                    <p className="restaurant-subtitle">
                        Hệ thống thành viên thân thiết
                    </p>
                </div>

                <h2 className="auth-title">Đăng ký thành viên</h2>

                <form onSubmit={handleSubmit}>

                    {/* HỌ TÊN */}
                    <div className="form-group">
                        <label className="form-label">Họ và tên</label>
                        <input
                            className="auth-input"
                            type="text"
                            name="HoTen"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* NGÀY SINH */}
                    <div className="form-group">
                        <label className="form-label">Ngày sinh</label>
                        <input
                            className="auth-input"
                            type="date"
                            name="NgaySinh"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* GIỚI TÍNH */}
                    <div className="form-group">
                        <label className="form-label">Giới tính</label>
                        <select
                            className="auth-input"
                            name="GioiTinh"
                            onChange={handleChange}
                        >
                            <option value="Nam">Nam</option>
                            <option value="Nu">Nữ</option>
                        </select>
                    </div>

                    {/* EMAIL */}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            className="auth-input"
                            type="email"
                            name="Email"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* SĐT */}
                    <div className="form-group">
                        <label className="form-label">Số điện thoại</label>
                        <input
                            className="auth-input"
                            type="text"
                            name="SoDienThoai"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* PASSWORD */}
                    <div className="form-group">
                        <label className="form-label">Mật khẩu</label>

                        <div className="password-box">
                            <input
                                className="auth-input"
                                type={showPassword ? "text" : "password"}
                                name="MatKhau"
                                onChange={handleChange}
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

                    {/* CONFIRM PASSWORD */}
                    <div className="form-group">
                        <label className="form-label">
                            Xác nhận mật khẩu
                        </label>

                        <div className="password-box">
                            <input
                                className="auth-input"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                            />

                            <span
                                className="password-eye"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? (
                                    <FaEyeSlash />
                                ) : (
                                    <FaEye />
                                )}
                            </span>
                        </div>
                    </div>

                    {/* PASSWORD STRENGTH */}
                    {formData.MatKhau && (
                        <div className="strength-wrapper">

                            <div className="strength-bar-bg">
                                <div
                                    className="strength-bar"
                                    style={{
                                        width: strength.width,
                                        background: strength.color
                                    }}
                                />
                            </div>

                            <div
                                className="strength-text"
                                style={{ color: strength.color }}
                            >
                                {strength.text}
                            </div>

                        </div>
                    )}

                    {/* SUBMIT */}
                    <button className="auth-btn" type="submit">
                        Đăng ký
                    </button>

                    {/* LOGIN LINK */}
                    <div className="text-center mt-4">
                        <span>Đã có tài khoản?</span>
                        <a href="/member/login" className="auth-link ms-2">
                            Đăng nhập
                        </a>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default Register;