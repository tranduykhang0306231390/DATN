import { useRef, useState } from "react";
import { FaGift } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { registerMember } from "../../api/authApi";
import {
    AuthMessage,
    CustomerAuthLayout,
    PasswordField,
} from "../../components/customer/auth";
import {
    getAuthRequestMessage,
    getPasswordStrength,
    MEMBER_NAME_PATTERN,
    normalizeFieldErrors,
    PASSWORD_PATTERN,
    PHONE_PATTERN,
} from "../../utils/auth";
import { getPreviousLocalCalendarDate } from "../../utils/customerDate";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM = {
    HoTen: "",
    NgaySinh: "",
    GioiTinh: "Nam",
    Email: "",
    SoDienThoai: "",
    MatKhau: "",
    MatKhau_confirmation: "",
};

function Register() {
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const maxBirthDate = getPreviousLocalCalendarDate();
    const strength = getPasswordStrength(form.MatKhau);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: "" }));
        setGeneralError("");
    };

    const validate = () => {
        const errors = {};
        const fullName = form.HoTen.trim();
        const email = form.Email.trim();
        const phone = form.SoDienThoai.trim();

        if (!fullName) errors.HoTen = "Họ tên không được để trống.";
        else if (fullName.length < 3) errors.HoTen = "Họ tên phải từ 3 ký tự.";
        else if (fullName.length > 100) errors.HoTen = "Họ tên không quá 100 ký tự.";
        else if (!MEMBER_NAME_PATTERN.test(fullName)) errors.HoTen = "Họ tên chỉ gồm chữ cái và khoảng trắng.";

        if (!form.NgaySinh) errors.NgaySinh = "Ngày sinh không được để trống.";
        else if (form.NgaySinh > maxBirthDate) errors.NgaySinh = "Ngày sinh phải trước ngày hôm nay.";

        if (!["Nam", "Nu"].includes(form.GioiTinh)) errors.GioiTinh = "Vui lòng chọn giới tính.";

        if (!email) errors.Email = "Email không được để trống.";
        else if (!EMAIL_PATTERN.test(email)) errors.Email = "Email không đúng định dạng.";

        if (!phone) errors.SoDienThoai = "Số điện thoại không được để trống.";
        else if (!PHONE_PATTERN.test(phone)) errors.SoDienThoai = "Số điện thoại phải gồm 10 số và bắt đầu bằng 0.";

        if (!form.MatKhau) errors.MatKhau = "Mật khẩu không được để trống.";
        else if (!PASSWORD_PATTERN.test(form.MatKhau)) {
            errors.MatKhau = "Mật khẩu phải có 8–20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
        }

        if (!form.MatKhau_confirmation) {
            errors.MatKhau_confirmation = "Vui lòng xác nhận mật khẩu.";
        } else if (form.MatKhau_confirmation !== form.MatKhau) {
            errors.MatKhau_confirmation = "Xác nhận mật khẩu không khớp.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submittingRef.current || !validate()) return;

        submittingRef.current = true;
        setSubmitting(true);
        setGeneralError("");

        try {
            await registerMember({
                ...form,
                HoTen: form.HoTen.trim(),
                Email: form.Email.trim().toLowerCase(),
                SoDienThoai: form.SoDienThoai.trim(),
            });

            await Swal.fire({
                icon: "success",
                title: "Đăng ký thành công",
                text: "Bạn có thể đăng nhập bằng tài khoản vừa tạo.",
                timer: 1600,
                showConfirmButton: false,
            });
            navigate("/member/login", { replace: true });
        } catch (error) {
            const responseErrors = normalizeFieldErrors(error);
            const hasFieldErrors = Object.keys(responseErrors).length > 0;
            if (hasFieldErrors) setFieldErrors(responseErrors);
            setGeneralError(hasFieldErrors
                ? "Vui lòng kiểm tra lại các trường được đánh dấu."
                : getAuthRequestMessage(error, "Không thể đăng ký lúc này. Vui lòng thử lại."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <CustomerAuthLayout
            eyebrow="Bắt đầu hành trình"
            title="Đăng ký thành viên"
            description="Tạo tài khoản bằng đúng thông tin của bạn để tích điểm và nhận quyền lợi theo hạng."
            footer={(
                <span>
                    Đã có tài khoản? <Link to="/member/login">Đăng nhập</Link>
                </span>
            )}
        >
            <form className="customer-auth__form" onSubmit={handleSubmit} noValidate>
                <AuthMessage message={generalError} />

                <div className="customer-auth__grid customer-auth__grid--three">
                    <div className="customer-auth__field">
                        <label htmlFor="register-name">Họ và tên</label>
                        <input
                            id="register-name"
                            name="HoTen"
                            type="text"
                            className="customer-input customer-auth__input"
                            value={form.HoTen}
                            onChange={(event) => updateField("HoTen", event.target.value)}
                            autoComplete="name"
                            aria-invalid={Boolean(fieldErrors.HoTen)}
                            aria-describedby={fieldErrors.HoTen ? "register-name-error" : undefined}
                            disabled={submitting}
                            required
                        />
                        {fieldErrors.HoTen && <small id="register-name-error" className="customer-auth__error">{fieldErrors.HoTen}</small>}
                    </div>

                    <div className="customer-auth__field">
                        <label htmlFor="register-birth-date">Ngày sinh</label>
                        <input
                            id="register-birth-date"
                            name="NgaySinh"
                            type="date"
                            className="customer-input customer-auth__input"
                            value={form.NgaySinh}
                            max={maxBirthDate}
                            onChange={(event) => updateField("NgaySinh", event.target.value)}
                            autoComplete="bday"
                            aria-invalid={Boolean(fieldErrors.NgaySinh)}
                            aria-describedby={fieldErrors.NgaySinh ? "register-birth-date-error" : undefined}
                            disabled={submitting}
                            required
                        />
                        {fieldErrors.NgaySinh && <small id="register-birth-date-error" className="customer-auth__error">{fieldErrors.NgaySinh}</small>}
                    </div>

                    <div className="customer-auth__field">
                        <label htmlFor="register-gender">Giới tính</label>
                        <select
                            id="register-gender"
                            name="GioiTinh"
                            className="customer-select customer-auth__select"
                            value={form.GioiTinh}
                            onChange={(event) => updateField("GioiTinh", event.target.value)}
                            aria-invalid={Boolean(fieldErrors.GioiTinh)}
                            aria-describedby={fieldErrors.GioiTinh ? "register-gender-error" : undefined}
                            disabled={submitting}
                            required
                        >
                            <option value="Nam">Nam</option>
                            <option value="Nu">Nữ</option>
                        </select>
                        {fieldErrors.GioiTinh && <small id="register-gender-error" className="customer-auth__error">{fieldErrors.GioiTinh}</small>}
                    </div>
                </div>

                <div className="customer-auth__grid">
                    <div className="customer-auth__field">
                        <label htmlFor="register-email">Email</label>
                        <input
                            id="register-email"
                            name="Email"
                            type="email"
                            className="customer-input customer-auth__input"
                            value={form.Email}
                            onChange={(event) => updateField("Email", event.target.value)}
                            autoComplete="email"
                            inputMode="email"
                            aria-invalid={Boolean(fieldErrors.Email)}
                            aria-describedby={fieldErrors.Email ? "register-email-error" : undefined}
                            disabled={submitting}
                            required
                        />
                        {fieldErrors.Email && <small id="register-email-error" className="customer-auth__error">{fieldErrors.Email}</small>}
                    </div>

                    <div className="customer-auth__field">
                        <label htmlFor="register-phone">Số điện thoại</label>
                        <input
                            id="register-phone"
                            name="SoDienThoai"
                            type="tel"
                            className="customer-input customer-auth__input"
                            value={form.SoDienThoai}
                            onChange={(event) => updateField("SoDienThoai", event.target.value)}
                            autoComplete="tel"
                            inputMode="numeric"
                            maxLength={10}
                            aria-invalid={Boolean(fieldErrors.SoDienThoai)}
                            aria-describedby={fieldErrors.SoDienThoai ? "register-phone-error" : undefined}
                            disabled={submitting}
                            required
                        />
                        {fieldErrors.SoDienThoai && <small id="register-phone-error" className="customer-auth__error">{fieldErrors.SoDienThoai}</small>}
                    </div>
                </div>

                <div className="customer-auth__grid">
                    <PasswordField
                        id="register-password"
                        name="MatKhau"
                        label="Mật khẩu"
                        value={form.MatKhau}
                        onChange={(event) => updateField("MatKhau", event.target.value)}
                        error={fieldErrors.MatKhau}
                        help="8–20 ký tự, gồm chữ hoa, chữ thường, số và @$!%*#?&."
                        autoComplete="new-password"
                        disabled={submitting}
                    />
                    <PasswordField
                        id="register-password-confirmation"
                        name="MatKhau_confirmation"
                        label="Xác nhận mật khẩu"
                        value={form.MatKhau_confirmation}
                        onChange={(event) => updateField("MatKhau_confirmation", event.target.value)}
                        error={fieldErrors.MatKhau_confirmation}
                        autoComplete="new-password"
                        disabled={submitting}
                    />
                </div>

                {strength.score > 0 && (
                    <div
                        className="customer-auth__strength"
                        data-score={strength.score}
                        data-level={strength.key}
                        aria-label={`Độ mạnh mật khẩu: ${strength.label}`}
                    >
                        <span className="customer-auth__strength-track" aria-hidden="true"><i /><i /><i /></span>
                        <strong>{strength.label}</strong>
                        <small>Thước đo chỉ hỗ trợ nhập liệu; backend vẫn là nơi xác thực quy tắc mật khẩu.</small>
                    </div>
                )}

                <button
                    className="customer-button customer-button--primary customer-auth__submit"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? (
                        <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang đăng ký…</>
                    ) : (
                        <><FaGift aria-hidden="true" /> Đăng ký</>
                    )}
                </button>
            </form>
        </CustomerAuthLayout>
    );
}

export default Register;
