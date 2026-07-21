import { useRef, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { forgotPassword } from "../../api/authApi";
import { AuthMessage, CustomerAuthLayout, OtpInput } from "../../components/customer/auth";
import useFirebasePhoneAuth from "../../hooks/useFirebasePhoneAuth";
import { getAuthRequestMessage, PHONE_PATTERN } from "../../utils/auth";

function ForgotPassword() {
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const [step, setStep] = useState("phone"); // 'phone' | 'otp'
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const {
        recaptchaContainerId,
        sendOtp,
        confirmOtp,
        reset: resetFirebase,
        isSending,
        isConfirming,
        errorMessage: firebaseError,
        resendAvailableIn,
        canResend,
    } = useFirebasePhoneAuth();

    const handleSendOtp = async (event) => {
        event.preventDefault();
        const trimmed = phone.trim();
        if (!PHONE_PATTERN.test(trimmed)) {
            setPhoneError("Số điện thoại phải gồm 10 số và bắt đầu bằng 0.");
            return;
        }
        setPhoneError("");
        setGeneralError("");

        const sent = await sendOtp(trimmed);
        if (sent) setStep("otp");
    };

    const handleResend = async () => {
        if (!canResend || isSending) return;
        await sendOtp(phone.trim());
        setOtp("");
    };

    const handleChangePhone = () => {
        resetFirebase();
        setOtp("");
        setStep("phone");
    };

    const handleConfirmOtp = async (event) => {
        event.preventDefault();
        if (submittingRef.current || otp.length !== 6) return;

        submittingRef.current = true;
        setSubmitting(true);
        setGeneralError("");

        try {
            const idToken = await confirmOtp(otp);
            if (!idToken) return;

            const response = await forgotPassword({
                SoDienThoai: phone.trim(),
                FirebaseIdToken: idToken,
            });

            const resetToken = response.data?.reset_token;
            if (typeof resetToken !== "string" || !resetToken) {
                setGeneralError("Máy chủ chưa trả về phiên đặt lại mật khẩu hợp lệ. Vui lòng thử lại.");
                return;
            }

            navigate("/reset-password", {
                replace: true,
                state: {
                    SoDienThoai: phone.trim(),
                    ResetToken: resetToken,
                    ExpiresIn: response.data?.expires_in,
                    RequestedAt: Date.now(),
                },
            });
        } catch (error) {
            setGeneralError(getAuthRequestMessage(error, "Không thể xác thực tài khoản lúc này."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <CustomerAuthLayout
            eyebrow="Khôi phục truy cập"
            title="Quên mật khẩu"
            description="Xác minh số điện thoại của bạn qua mã OTP để đặt lại mật khẩu."
            footer={<span>Đã nhớ mật khẩu? <Link to="/login">Quay lại đăng nhập</Link></span>}
            compact
        >
            <div id={recaptchaContainerId} />

            {step === "phone" && (
                <form className="customer-auth__form" onSubmit={handleSendOtp} noValidate>
                    <AuthMessage message={generalError || firebaseError} />

                    <div className="customer-auth__field">
                        <label htmlFor="forgot-phone">Số điện thoại</label>
                        <input
                            id="forgot-phone"
                            name="SoDienThoai"
                            type="tel"
                            className="customer-input customer-auth__input"
                            value={phone}
                            onChange={(event) => { setPhone(event.target.value); setPhoneError(""); }}
                            autoComplete="tel"
                            inputMode="numeric"
                            maxLength={10}
                            aria-invalid={Boolean(phoneError)}
                            disabled={isSending}
                            required
                        />
                        {phoneError && <small className="customer-auth__error">{phoneError}</small>}
                    </div>

                    <button className="customer-button customer-button--primary customer-auth__submit" type="submit" disabled={isSending}>
                        {isSending ? (
                            <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang gửi mã…</>
                        ) : (
                            <>Gửi mã OTP <FaArrowRight aria-hidden="true" /></>
                        )}
                    </button>
                </form>
            )}

            {step === "otp" && (
                <form className="customer-auth__form" onSubmit={handleConfirmOtp} noValidate>
                    <AuthMessage message={generalError || firebaseError} />

                    <p className="customer-form-field__help">Mã OTP đã được gửi tới số <strong>{phone}</strong>.</p>

                    <OtpInput value={otp} onChange={setOtp} disabled={submitting || isConfirming} idPrefix="forgot-otp" />

                    <div className="customer-auth__meta-row">
                        <button type="button" className="customer-auth__link" onClick={handleChangePhone} disabled={submitting}>
                            Đổi số điện thoại
                        </button>
                        <button type="button" className="customer-auth__link" onClick={handleResend} disabled={!canResend || isSending || submitting}>
                            {canResend ? "Gửi lại mã" : `Gửi lại sau ${resendAvailableIn}s`}
                        </button>
                    </div>

                    <button
                        className="customer-button customer-button--primary customer-auth__submit"
                        type="submit"
                        disabled={submitting || isConfirming || otp.length !== 6}
                    >
                        {submitting || isConfirming ? (
                            <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang xác minh…</>
                        ) : (
                            <>Tiếp tục <FaArrowRight aria-hidden="true" /></>
                        )}
                    </button>
                </form>
            )}
        </CustomerAuthLayout>
    );
}

export default ForgotPassword;
