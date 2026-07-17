import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { updateMemberProfile } from "../../api/authApi";
import ChangePasswordForm from "./ChangePasswordForm";

import "../../assets/css/memberRank.css";

function MemberProfile({ user }) {

    const formatDateVi = (value) => {
        if (!value) return "—";
        const [year, month, day] = String(value).slice(0, 10).split("-");
        return year && month && day ? `${day}/${month}/${year}` : value;
    };

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [formData, setFormData] = useState({
        HoTen: "",
        Email: "",
        SoDienThoai: "",
        NgaySinh: "",
        GioiTinh: ""
    });

    useEffect(() => {
        if (user) {
            setFormData({
                HoTen: user.HoTen || "",
                Email: user.Email || "",
                SoDienThoai: user.SoDienThoai || "",
                NgaySinh: user.NgaySinh || "",
                GioiTinh: user.GioiTinh || ""
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCancel = () => {
        // Khôi phục lại dữ liệu gốc từ user, hủy các thay đổi chưa lưu
        if (user) {
            setFormData({
                HoTen: user.HoTen || "",
                Email: user.Email || "",
                SoDienThoai: user.SoDienThoai || "",
                NgaySinh: user.NgaySinh || "",
                GioiTinh: user.GioiTinh || ""
            });
        }
        setIsEditing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await updateMemberProfile(formData);

            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: res.data.message || "Cập nhật thành công"
            });

            // Cập nhật lại UI ngay lập tức
            if (res.data.user) {
                setFormData({
                    HoTen: res.data.user.HoTen || "",
                    Email: res.data.user.Email || "",
                    SoDienThoai: res.data.user.SoDienThoai || "",
                    NgaySinh: res.data.user.NgaySinh || "",
                    GioiTinh: res.data.user.GioiTinh || ""
                });
            }

            // Cập nhật xong thì quay về chế độ xem
            setIsEditing(false);

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
                text: "Cập nhật thất bại"
            });
        }
    };

    return (
        <div className="profile-section">

            <div className="profile-header">
                <h3 className="section-title">
                    Thông tin cá nhân
                </h3>


            </div>

            {!isEditing ? (

                /* ============ CHẾ ĐỘ XEM (READ-ONLY) ============ */
                <div className="profile-view">

                    <div className="row">
                        <div className="col-md-6">
                            <label>Họ và tên</label>
                            <p className="profile-value">{formData.HoTen || "—"}</p>
                        </div>

                        <div className="col-md-6">
                            <label>Email</label>
                            <p className="profile-value">{formData.Email || "—"}</p>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <label>Số điện thoại</label>
                            <p className="profile-value">{formData.SoDienThoai || "—"}</p>
                        </div>

                        <div className="col-md-6">
                            <label>Ngày sinh</label>
                            <p className="profile-value">{formatDateVi(formData.NgaySinh)}</p>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <label>Giới tính</label>
                            <p className="profile-value">{formData.GioiTinh || "—"}</p>
                        </div>
                    </div>
                    {/* Chỉ hiện nút Sửa + Đổi mật khẩu khi đang ở chế độ xem */}
                    {!isEditing && (
                        <div
                            className="profile-actions"
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px",
                                marginTop: "20px"
                            }}
                        >
                            <button
                                type="button"
                                className="edit-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                Chỉnh sửa
                            </button>

                            <button
                                type="button"
                                className="edit-btn"
                                onClick={() => setIsChangingPassword((prev) => !prev)}
                            >
                                Đổi mật khẩu
                            </button>
                        </div>
                    )}

                    {/* Form đổi mật khẩu hiện bên dưới, tách khỏi hàng nút */}
                    {!isEditing && isChangingPassword && (
                        <ChangePasswordForm
                            onCancel={() => setIsChangingPassword(false)}
                            onSuccess={() => setIsChangingPassword(false)}
                        />
                    )}
                </div>

            ) : (

                /* ============ CHẾ ĐỘ CHỈNH SỬA (FORM) ============ */
                <form className="profile-form" onSubmit={handleSubmit}>

                    <div className="row">
                        <div className="col-md-6">
                            <label>Họ và tên</label>
                            <input
                                type="text"
                                name="HoTen"
                                value={formData.HoTen}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label>Email</label>
                            <input
                                type="email"
                                name="Email"
                                value={formData.Email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <label>Số điện thoại</label>
                            <input
                                type="text"
                                name="SoDienThoai"
                                value={formData.SoDienThoai}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label>Ngày sinh</label>
                            <input
                                type="date"
                                name="NgaySinh"
                                value={formData.NgaySinh}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <label>Giới tính</label>
                            <select
                                name="GioiTinh"
                                value={formData.GioiTinh}
                                onChange={handleChange}
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                            </select>
                        </div>
                    </div>

                    {/* Nút Hủy + Lưu, căn phải theo đúng toàn bộ chiều rộng form */}
                    <div className="text-end mt-4 form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={handleCancel}
                        >
                            Hủy
                        </button>
                        <button className="save-btn" type="submit">
                            Lưu
                        </button>
                    </div>

                </form>

            )}

        </div>
    );
}

export default MemberProfile;
