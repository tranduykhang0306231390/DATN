import { useRef, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { forgotPassword } from "../../api/authApi";
import { AuthMessage, CustomerAuthLayout } from "../../components/customer/auth";
import {
    getAuthRequestMessage,
    normalizeFieldErrors,
    PHONE_PATTERN,
} from "../../utils/auth";
import { getPreviousLocalCalendarDate } from "../../utils/customerDate";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword() {
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const [form, setForm] = useState({ Email: "", SoDienThoai: "", NgaySinh: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const maxBirthDate = getPreviousLocalCalendarDate();

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: "" }));
        setGeneralError("");
    };

    const validate = () => {
        const errors = {};
        const email = form.Email.trim();
        const phone = form.SoDienThoai.trim();

        if (!email) errors.Email = "Vui lòng nhập email.";
        else if (!EMAIL_PATTERN.test(email)) errors.Email = "Email không hợp lệ.";

        if (!phone) errors.SoDienThoai = "Vui lòng nhập số điện thoại.";
        else if (!PHONE_PATTERN.test(phone)) errors.SoDienThoai = "Số điện thoại phải gồm 10 số và bắt đầu bằng 0.";

        if (!form.NgaySinh) errors.NgaySinh = "Vui lòng nhập ngày sinh.";
        else if (form.NgaySinh > maxBirthDate) errors.NgaySinh = "Ngày sinh phải trước ngày hôm nay.";

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
            const payload = {
                Email: form.Email.trim().toLowerCase(),
                SoDienThoai: form.SoDienThoai.trim(),
                NgaySinh: form.NgaySinh,
            };
            const response = await forgotPassword(payload);
            const resetToken = response.data?.reset_token;

            if (typeof resetToken !== "string" || !resetToken) {
                setGeneralError("Máy chủ chưa trả về phiên đặt lại mật khẩu hợp lệ. Vui lòng thử lại.");
                return;
            }

            navigate("/reset-password", {
                replace: true,
                state: {
                    ...payload,
                    ResetToken: resetToken,
                    ExpiresIn: response.data?.expires_in,
                    RequestedAt: Date.now(),
                },
            });
        } catch (error) {
            const responseErrors = normalizeFieldErrors(error);
            const hasFieldErrors = Object.keys(responseErrors).length > 0;
            if (hasFieldErrors) setFieldErrors(responseErrors);
            setGeneralError(hasFieldErrors
                ? "Vui lòng kiểm tra lại các trường được đánh dấu."
                : getAuthRequestMessage(error, "Không thể xác thực tài khoản lúc này."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <CustomerAuthLayout
            eyebrow="Khôi phục truy cập"
            title="Quên mật khẩu"
            description="Nhập đúng thông tin đã đăng ký. Dữ liệu này chỉ được gửi đến API xác thực hiện tại."
            footer={<span>Đã nhớ mật khẩu? <Link to="/login">Quay lại đăng nhập</Link></span>}
            compact
        >
            <form className="customer-auth__form" onSubmit={handleSubmit} noValidate>
                <AuthMessage message={generalError} />

                <div className="customer-auth__field">
                    <label htmlFor="forgot-email">Email</label>
                    <input
                        id="forgot-email"
                        name="Email"
                        type="email"
                        className="customer-input customer-auth__input"
                        value={form.Email}
                        onChange={(event) => updateField("Email", event.target.value)}
                        autoComplete="email"
                        inputMode="email"
                        aria-invalid={Boolean(fieldErrors.Email)}
                        aria-describedby={fieldErrors.Email ? "forgot-email-error" : undefined}
                        disabled={submitting}
                        required
                    />
                    {fieldErrors.Email && <small id="forgot-email-error" className="customer-auth__error">{fieldErrors.Email}</small>}
                </div>

                <div className="customer-auth__grid">
                    <div className="customer-auth__field">
                        <label htmlFor="forgot-phone">Số điện thoại</label>
                        <input
                            id="forgot-phone"
                            name="SoDienThoai"
                            type="tel"
                            className="customer-input customer-auth__input"
                            value={form.SoDienThoai}
                            onChange={(event) => updateField("SoDienThoai", event.target.value)}
                            autoComplete="tel"
                            inputMode="numeric"
                            maxLength={10}
                            aria-invalid={Boolean(fieldErrors.SoDienThoai)}
                            aria-describedby={fieldErrors.SoDienThoai ? "forgot-phone-error" : undefined}
                            disabled={submitting}
                            required
                        />
                        {fieldErrors.SoDienThoai && <small id="forgot-phone-error" className="customer-auth__error">{fieldErrors.SoDienThoai}</small>}
                    </div>

                    <div className="customer-auth__field">
                        <label htmlFor="forgot-birth-date">Ngày sinh</label>
                        <input
                            id="forgot-birth-date"
                            name="NgaySinh"
                            type="date"
                            className="customer-input customer-auth__input"
                            value={form.NgaySinh}
                            max={maxBirthDate}
                            onChange={(event) => updateField("NgaySinh", event.target.value)}
                            autoComplete="bday"
                            aria-invalid={Boolean(fieldErrors.NgaySinh)}
                            aria-describedby={fieldErrors.NgaySinh ? "forgot-birth-date-error" : undefined}
                            disabled={submitting}
                            required
                        />
                        {fieldErrors.NgaySinh && <small id="forgot-birth-date-error" className="customer-auth__error">{fieldErrors.NgaySinh}</small>}
                    </div>
                </div>

                <button
                    className="customer-button customer-button--primary customer-auth__submit"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? (
                        <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang xác thực…</>
                    ) : (
                        <>Tiếp tục <FaArrowRight aria-hidden="true" /></>
                    )}
                </button>
            </form>
        </CustomerAuthLayout>
    );
}

export default ForgotPassword;
