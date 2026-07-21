import { useRef, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { resetPassword } from "../../api/authApi";
import {
    AuthMessage,
    CustomerAuthLayout,
    PasswordField,
} from "../../components/customer/auth";
import {
    getAuthRequestMessage,
    getPasswordStrength,
    normalizeFieldErrors,
    PASSWORD_PATTERN,
} from "../../utils/auth";

const isResetStateValid = (state) => (
    typeof state?.SoDienThoai === "string"
    && typeof state?.ResetToken === "string"
    && state.ResetToken.length > 0
);

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const submittingRef = useRef(false);
    const [form, setForm] = useState({ MatKhau: "", MatKhau_confirmation: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [tokenInvalid, setTokenInvalid] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const resetState = location.state;
    const strength = getPasswordStrength(form.MatKhau);

    if (!isResetStateValid(resetState)) {
        return <Navigate to="/forgot-password" replace />;
    }

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: "" }));
        setGeneralError("");
    };

    const validate = () => {
        const errors = {};

        if (!form.MatKhau) errors.MatKhau = "Vui lòng nhập mật khẩu mới.";
        else if (!PASSWORD_PATTERN.test(form.MatKhau)) {
            errors.MatKhau = "Mật khẩu phải có 8–20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
        }

        if (!form.MatKhau_confirmation) {
            errors.MatKhau_confirmation = "Vui lòng xác nhận mật khẩu mới.";
        } else if (form.MatKhau_confirmation !== form.MatKhau) {
            errors.MatKhau_confirmation = "Xác nhận mật khẩu không khớp.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submittingRef.current || tokenInvalid || !validate()) return;

        submittingRef.current = true;
        setSubmitting(true);
        setGeneralError("");

        try {
            await resetPassword({
                SoDienThoai: resetState.SoDienThoai,
                ResetToken: resetState.ResetToken,
                MatKhau: form.MatKhau,
                MatKhau_confirmation: form.MatKhau_confirmation,
            });

            await Swal.fire({
                icon: "success",
                title: "Đặt lại mật khẩu thành công",
                text: "Hãy đăng nhập bằng mật khẩu mới.",
                timer: 1700,
                showConfirmButton: false,
            });
            navigate("/login", { replace: true });
        } catch (error) {
            const responseErrors = normalizeFieldErrors(error);
            const hasFieldErrors = Object.keys(responseErrors).length > 0;
            const message = hasFieldErrors
                ? "Vui lòng kiểm tra lại các trường được đánh dấu."
                : getAuthRequestMessage(error, "Không thể đặt lại mật khẩu lúc này.");
            const invalidResetSession = Number(error?.response?.status) === 422
                && /(?:phiên|token|hết hạn|không hợp lệ)/iu.test(message);

            if (hasFieldErrors) setFieldErrors(responseErrors);
            if (invalidResetSession) setTokenInvalid(true);
            setGeneralError(message);
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <CustomerAuthLayout
            eyebrow="Bảo vệ tài khoản"
            title="Tạo mật khẩu mới"
            description="Phiên đặt lại được giữ trong bộ nhớ điều hướng và không xuất hiện trong URL."
            footer={(
                tokenInvalid
                    ? <Link to="/forgot-password">Bắt đầu lại quá trình xác thực</Link>
                    : <span>Sau khi hoàn tất, bạn sẽ quay lại trang đăng nhập.</span>
            )}
            compact
        >
            <form className="customer-auth__form" onSubmit={handleSubmit} noValidate>
                <AuthMessage message={generalError} />

                <PasswordField
                    id="reset-password"
                    name="MatKhau"
                    label="Mật khẩu mới"
                    value={form.MatKhau}
                    onChange={(event) => updateField("MatKhau", event.target.value)}
                    error={fieldErrors.MatKhau}
                    help="8–20 ký tự, gồm chữ hoa, chữ thường, số và @$!%*#?&."
                    autoComplete="new-password"
                    disabled={submitting || tokenInvalid}
                />

                <PasswordField
                    id="reset-password-confirmation"
                    name="MatKhau_confirmation"
                    label="Xác nhận mật khẩu mới"
                    value={form.MatKhau_confirmation}
                    onChange={(event) => updateField("MatKhau_confirmation", event.target.value)}
                    error={fieldErrors.MatKhau_confirmation}
                    autoComplete="new-password"
                    disabled={submitting || tokenInvalid}
                />

                {strength.score > 0 && (
                    <div
                        className="customer-auth__strength"
                        data-score={strength.score}
                        data-level={strength.key}
                        aria-label={`Độ mạnh mật khẩu: ${strength.label}`}
                    >
                        <span className="customer-auth__strength-track" aria-hidden="true"><i /><i /><i /></span>
                        <strong>{strength.label}</strong>
                    </div>
                )}

                <button
                    className="customer-button customer-button--primary customer-auth__submit"
                    type="submit"
                    disabled={submitting || tokenInvalid}
                >
                    {submitting ? (
                        <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang cập nhật…</>
                    ) : (
                        <><FaCheck aria-hidden="true" /> Đặt lại mật khẩu</>
                    )}
                </button>
            </form>
        </CustomerAuthLayout>
    );
}

export default ResetPassword;
