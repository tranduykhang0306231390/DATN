import { useState } from "react";
import Swal from "sweetalert2";

import { changePassword } from "../../api/authApi";

// Cùng quy tắc với lúc đăng ký: 8-20 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,20}$/;

function ChangePasswordForm({ onCancel, onSuccess }) {

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        MatKhauHienTai: "",
        MatKhauMoi: "",
        MatKhauMoi_confirmation: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateClientSide = () => {
        if (!formData.MatKhauHienTai) {
            Swal.fire({
                icon: "error",
                title: "Lỗi validate",
                text: "Vui lòng nhập mật khẩu hiện tại."
            });
            return false;
        }

        if (!PASSWORD_REGEX.test(formData.MatKhauMoi)) {
            Swal.fire({
                icon: "error",
                title: "Lỗi validate",
                text: "Mật khẩu mới phải từ 8-20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*#?&)."
            });
            return false;
        }

        if (formData.MatKhauMoi !== formData.MatKhauMoi_confirmation) {
            Swal.fire({
                icon: "error",
                title: "Lỗi validate",
                text: "Xác nhận mật khẩu mới không khớp."
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateClientSide()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await changePassword(formData);

            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: res.data.message || "Đổi mật khẩu thành công"
            });

            onSuccess?.();

        } catch (error) {

            if (error.response?.status === 422) {
                const errors = error.response.data.errors;

                let message = "";
                Object.values(errors).forEach(item => {
                    message += item[0] + "<br>";
                });

                Swal.fire({
                    icon: "error",
                    title: "Lỗi validate",
                    html: message
                });

                return;
            }

            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Đổi mật khẩu thất bại"
            });

        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="change-password-panel"
            style={{
                marginTop: "20px",
                padding: "24px",
                border: "1px solid #e2e2e2",
                borderRadius: "10px",
                background: "#fafafa"
            }}
        >
            <h5
                style={{
                    marginBottom: "18px",
                    fontSize: "16px",
                    fontWeight: 600
                }}
            >
                Đổi mật khẩu
            </h5>

            <form className="profile-form change-password-form" onSubmit={handleSubmit}>

                <div className="row" style={{ marginBottom: "16px" }}>
                    <div className="col-md-6">
                        <label>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            name="MatKhauHienTai"
                            value={formData.MatKhauHienTai}
                            onChange={handleChange}
                            autoComplete="current-password"
                        />
                    </div>
                    <div className="col-md-6" />
                </div>

                <div className="row" style={{ marginBottom: "10px" }}>
                    <div className="col-md-6">
                        <label>Mật khẩu mới</label>
                        <input
                            type="password"
                            name="MatKhauMoi"
                            value={formData.MatKhauMoi}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="col-md-6">
                        <label>Nhập lại mật khẩu mới</label>
                        <input
                            type="password"
                            name="MatKhauMoi_confirmation"
                            value={formData.MatKhauMoi_confirmation}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                {/* Dòng nhắc nhở quy tắc mật khẩu */}
                <p
                    className="password-hint"
                    style={{
                        fontSize: "13px",
                        color: "#888",
                        fontStyle: "italic",
                        marginTop: "4px",
                        marginBottom: "0"
                    }}
                >
                    Mật khẩu từ 8-20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*#?&).
                </p>

                <div className="text-end mt-4 form-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button
                        className="save-btn"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>

            </form>
        </div>
    );
}

export default ChangePasswordForm;
