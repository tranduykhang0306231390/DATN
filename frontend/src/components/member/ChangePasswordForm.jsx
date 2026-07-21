import { useRef, useState } from "react";
import { FaKey, FaMobileAlt, FaSave, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { confirmChangePassword, requestChangePasswordVerification } from "../../api/authApi";
import { OtpInput, PasswordField } from "../customer/auth";
import useFirebasePhoneAuth from "../../hooks/useFirebasePhoneAuth";
import { resetSessionVerificationCache } from "../../services/sessionService";
import { getAuthRequestMessage, PASSWORD_PATTERN } from "../../utils/auth";
import { updateStoredAuthToken } from "../../utils/customerSession";

const getBackendFieldErrors = (error) => {
    const errors = error?.response?.status === 422 ? error.response.data?.errors : null;
    if (!errors || typeof errors !== "object") return {};

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages.filter(Boolean).join(" ") : String(messages || ""),
        ]),
    );
};

/**
 * Đổi mật khẩu: khách hàng PHẢI xác minh lại quyền sở hữu số điện thoại
 * của chính tài khoản mình qua Firebase OTP trước khi được đổi mật khẩu
 * — thay cho việc chỉ cần nhớ mật khẩu cũ (mật khẩu mặc định ban đầu vốn
 * chỉ là số điện thoại, độ bảo mật thấp nên không đủ để tự xác thực).
 */
function ChangePasswordForm({ phone, onCancel, onSuccess, onSubmittingChange }) {
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const [step, setStep] = useState("start"); // 'start' | 'otp' | 'password'
    const [otp, setOtp] = useState("");
    const [changeToken, setChangeToken] = useState("");
    const [passwordForm, setPasswordForm] = useState({ MatKhauMoi: "", MatKhauMoi_confirmation: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [requestError, setRequestError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        recaptchaContainerId,
        sendOtp,
        confirmOtp,
        isSending,
        isConfirming,
        errorMessage: firebaseError,
        resendAvailableIn,
        canResend,
    } = useFirebasePhoneAuth();

    const setSubmitting = (value) => {
        setIsSubmitting(value);
        onSubmittingChange?.(value);
    };

    const handleSendOtp = async () => {
        setRequestError("");
        const sent = await sendOtp(phone);
        if (sent) setStep("otp");
    };

    const handleResend = async () => {
        if (!canResend || isSending) return;
        await sendOtp(phone);
        setOtp("");
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        if (submittingRef.current || otp.length !== 6) return;

        submittingRef.current = true;
        setSubmitting(true);
        setRequestError("");

        try {
            const idToken = await confirmOtp(otp);
            if (!idToken) return;

            const response = await requestChangePasswordVerification(idToken);
            const token = response.data?.change_token;
            if (typeof token !== "string" || !token) {
                setRequestError("Máy chủ chưa trả về phiên xác minh hợp lệ. Vui lòng thử lại.");
                return;
            }

            setChangeToken(token);
            setStep("password");
        } catch (error) {
            setRequestError(getAuthRequestMessage(error, "Không thể xác minh OTP lúc này."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const validatePasswordForm = () => {
        const errors = {};

        if (!PASSWORD_PATTERN.test(passwordForm.MatKhauMoi)) {
            errors.MatKhauMoi = "Mật khẩu phải từ 8–20 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*#?&).";
        }

        if (!passwordForm.MatKhauMoi_confirmation) {
            errors.MatKhauMoi_confirmation = "Vui lòng xác nhận mật khẩu mới.";
        } else if (passwordForm.MatKhauMoi !== passwordForm.MatKhauMoi_confirmation) {
            errors.MatKhauMoi_confirmation = "Xác nhận mật khẩu mới không khớp.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChangePasswordField = (event) => {
        const { name, value } = event.target;
        setPasswordForm((current) => ({ ...current, [name]: value }));
        setFieldErrors((current) => ({ ...current, [name]: "" }));
        setRequestError("");
    };

    const handleConfirmPassword = async (event) => {
        event.preventDefault();
        if (submittingRef.current || !validatePasswordForm()) return;

        submittingRef.current = true;
        setSubmitting(true);
        setFieldErrors({});
        setRequestError("");

        try {
            const response = await confirmChangePassword({
                ChangeToken: changeToken,
                MatKhauMoi: passwordForm.MatKhauMoi,
                MatKhauMoi_confirmation: passwordForm.MatKhauMoi_confirmation,
            });

            if (response.data?.token && !updateStoredAuthToken(response.data.token)) {
                resetSessionVerificationCache();
                navigate("/login", { replace: true });
                return;
            }

            resetSessionVerificationCache();
            onSuccess?.(response.data?.message || "Đổi mật khẩu thành công.");
        } catch (error) {
            const backendErrors = getBackendFieldErrors(error);
            if (Object.keys(backendErrors).length > 0) {
                setFieldErrors(backendErrors);
                setRequestError(error.response?.data?.message || "Thông tin đổi mật khẩu chưa hợp lệ.");
            } else {
                setRequestError(getAuthRequestMessage(error, "Không thể đổi mật khẩu lúc này."));
            }
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <div className="change-password-form">
            <div id={recaptchaContainerId} />

            {(requestError || firebaseError) && (
                <div className="change-password-form__notice" role="alert" aria-live="assertive">
                    {requestError || firebaseError}
                </div>
            )}

            {step === "start" && (
                <div className="change-password-form__grid">
                    <p className="customer-form-field__help">
                        Để bảo vệ tài khoản, bạn cần xác minh lại số điện thoại <strong>{phone}</strong> bằng mã OTP trước khi đổi mật khẩu.
                    </p>
                    <div className="change-password-form__actions">
                        <button type="button" className="customer-button customer-button--ghost" onClick={onCancel} disabled={isSubmitting}>
                            <FaTimes aria-hidden="true" /> Hủy
                        </button>
                        <button
                            type="button"
                            className="customer-button customer-button--primary"
                            onClick={handleSendOtp}
                            disabled={isSending}
                        >
                            {isSending ? (
                                <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang gửi mã…</>
                            ) : (
                                <><FaMobileAlt aria-hidden="true" /> Gửi mã OTP</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {step === "otp" && (
                <form onSubmit={handleVerifyOtp} noValidate>
                    <p className="customer-form-field__help">Mã OTP đã được gửi tới số <strong>{phone}</strong>.</p>

                    <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting || isConfirming} idPrefix="change-password-otp" />

                    <div className="customer-auth__meta-row">
                        <button type="button" className="customer-auth__link" onClick={handleResend} disabled={!canResend || isSending || isSubmitting}>
                            {canResend ? "Gửi lại mã" : `Gửi lại sau ${resendAvailableIn}s`}
                        </button>
                    </div>

                    <div className="change-password-form__actions">
                        <button type="button" className="customer-button customer-button--ghost" onClick={onCancel} disabled={isSubmitting}>
                            <FaTimes aria-hidden="true" /> Hủy
                        </button>
                        <button
                            type="submit"
                            className="customer-button customer-button--primary"
                            disabled={isSubmitting || isConfirming || otp.length !== 6}
                        >
                            {isSubmitting || isConfirming ? (
                                <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang xác minh…</>
                            ) : (
                                <><FaKey aria-hidden="true" /> Xác minh</>
                            )}
                        </button>
                    </div>
                </form>
            )}

            {step === "password" && (
                <form onSubmit={handleConfirmPassword} noValidate>
                    <div className="change-password-form__grid">
                        <PasswordField
                            id="change-password-new"
                            name="MatKhauMoi"
                            label="Mật khẩu mới"
                            value={passwordForm.MatKhauMoi}
                            onChange={handleChangePasswordField}
                            error={fieldErrors.MatKhauMoi}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                        />
                        <PasswordField
                            id="change-password-new-confirmation"
                            name="MatKhauMoi_confirmation"
                            label="Xác nhận mật khẩu mới"
                            value={passwordForm.MatKhauMoi_confirmation}
                            onChange={handleChangePasswordField}
                            error={fieldErrors.MatKhauMoi_confirmation}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                        />
                    </div>

                    <p className="change-password-form__hint">
                        <FaKey aria-hidden="true" />
                        Mật khẩu mới gồm 8–20 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*#?&).
                    </p>

                    <div className="change-password-form__actions">
                        <button type="button" className="customer-button customer-button--ghost" onClick={onCancel} disabled={isSubmitting}>
                            <FaTimes aria-hidden="true" /> Hủy
                        </button>
                        <button type="submit" className="customer-button customer-button--primary" disabled={isSubmitting}>
                            <FaSave aria-hidden="true" /> {isSubmitting ? "Đang lưu…" : "Lưu mật khẩu"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default ChangePasswordForm;
