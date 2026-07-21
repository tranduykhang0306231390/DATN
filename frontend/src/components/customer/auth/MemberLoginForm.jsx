import { useRef, useState } from "react";
import { FaGift, FaKey, FaMobileAlt } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { memberLogin, memberLoginFirebase } from "../../../api/authApi";
import useFirebasePhoneAuth from "../../../hooks/useFirebasePhoneAuth";
import { resetSessionVerificationCache } from "../../../services/sessionService";
import {
    getAuthRequestMessage,
    getSafeMemberRedirect,
    normalizeFieldErrors,
    PHONE_PATTERN,
} from "../../../utils/auth";
import { storeAuthSession } from "../../../utils/customerSession";
import { AuthMessage } from "./CustomerAuthLayout";
import OtpInput from "./OtpInput";
import PasswordField from "./PasswordField";

function useLoginSuccess() {
    const navigate = useNavigate();
    const location = useLocation();

    return (token, user) => {
        const stored = storeAuthSession({ token, role: "member", user });
        if (!stored) return false;

        resetSessionVerificationCache();
        void Swal.fire({ icon: "success", title: "Đăng nhập thành công", timer: 1100, showConfirmButton: false });
        navigate(getSafeMemberRedirect(location.state?.from), { replace: true });
        return true;
    };
}

function PasswordLoginTab({ idPrefix }) {
    const submittingRef = useRef(false);
    const [form, setForm] = useState({ phone: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const handleLoginSuccess = useLoginSuccess();

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: "" }));
        setGeneralError("");
    };

    const validate = () => {
        const errors = {};
        const phone = form.phone.trim();

        if (!phone) errors.phone = "Vui lòng nhập số điện thoại.";
        else if (!PHONE_PATTERN.test(phone)) errors.phone = "Số điện thoại phải gồm 10 số và bắt đầu bằng 0.";

        if (!form.password) errors.password = "Vui lòng nhập mật khẩu.";
        else if (form.password.length < 6) errors.password = "Mật khẩu tối thiểu 6 ký tự.";

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
            const response = await memberLogin({
                SoDienThoai: form.phone.trim(),
                MatKhau: form.password,
            });

            if (!handleLoginSuccess(response.data?.token, response.data?.user)) {
                setGeneralError("Trình duyệt không thể lưu phiên đăng nhập. Vui lòng kiểm tra cài đặt lưu trữ.");
            }
        } catch (error) {
            const responseErrors = normalizeFieldErrors(error);
            const hasFieldErrors = Object.keys(responseErrors).length > 0;
            if (hasFieldErrors) setFieldErrors(responseErrors);
            setGeneralError(hasFieldErrors
                ? "Vui lòng kiểm tra lại các trường được đánh dấu."
                : getAuthRequestMessage(error, "Số điện thoại hoặc mật khẩu không chính xác."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const phoneId = `${idPrefix}-phone`;
    const passwordId = `${idPrefix}-password`;

    return (
        <form className="customer-auth__form" onSubmit={handleSubmit} noValidate>
            <AuthMessage message={generalError} />

            <div className="customer-auth__field">
                <label htmlFor={phoneId}>Số điện thoại</label>
                <input
                    id={phoneId}
                    name="phone"
                    type="tel"
                    className="customer-input customer-auth__input"
                    placeholder="0xxxxxxxxx"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    disabled={submitting}
                    required
                />
                {fieldErrors.phone && <small className="customer-auth__error">{fieldErrors.phone}</small>}
            </div>

            <PasswordField
                id={passwordId}
                name="password"
                label="Mật khẩu"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                error={fieldErrors.password}
                autoComplete="current-password"
                disabled={submitting}
            />

            <div className="customer-auth__meta-row">
                <span>Mật khẩu không được lưu trên trình duyệt.</span>
                <Link to="/forgot-password" className="customer-auth__link">Quên mật khẩu?</Link>
            </div>

            <button className="customer-button customer-button--primary customer-auth__submit" type="submit" disabled={submitting}>
                {submitting ? (
                    <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang đăng nhập…</>
                ) : (
                    <><FaGift aria-hidden="true" /> Đăng nhập</>
                )}
            </button>
        </form>
    );
}

function OtpLoginTab({ idPrefix }) {
    const submittingRef = useRef(false);
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("phone"); // 'phone' | 'otp'
    const [phoneError, setPhoneError] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const handleLoginSuccess = useLoginSuccess();

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

            const response = await memberLoginFirebase(idToken);
            if (!handleLoginSuccess(response.data?.token, response.data?.user)) {
                setGeneralError("Trình duyệt không thể lưu phiên đăng nhập. Vui lòng kiểm tra cài đặt lưu trữ.");
            }
        } catch (error) {
            setGeneralError(getAuthRequestMessage(error, "Không thể đăng nhập bằng OTP lúc này."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <div className="customer-auth__form">
            <div id={recaptchaContainerId} />
            <AuthMessage message={generalError || firebaseError} />

            {step === "phone" && (
                <form onSubmit={handleSendOtp} noValidate>
                    <div className="customer-auth__field">
                        <label htmlFor={`${idPrefix}-otp-phone`}>Số điện thoại</label>
                        <input
                            id={`${idPrefix}-otp-phone`}
                            type="tel"
                            className="customer-input customer-auth__input"
                            placeholder="0xxxxxxxxx"
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
                            <><FaMobileAlt aria-hidden="true" /> Gửi mã OTP</>
                        )}
                    </button>
                </form>
            )}

            {step === "otp" && (
                <form onSubmit={handleConfirmOtp} noValidate>
                    <p className="customer-form-field__help">Mã OTP đã được gửi tới số <strong>{phone}</strong>.</p>

                    <OtpInput value={otp} onChange={setOtp} disabled={submitting || isConfirming} idPrefix={`${idPrefix}-login-otp`} />

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
                            <><FaKey aria-hidden="true" /> Đăng nhập</>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}

function MemberLoginForm({ idPrefix = "member-login" }) {
    const [activeTab, setActiveTab] = useState("password"); // 'password' | 'otp'

    return (
        <div className="customer-auth__tabs-wrapper">
            <div className="customer-auth__tabs" role="tablist" aria-label="Phương thức đăng nhập">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "password"}
                    className={`customer-auth__tab ${activeTab === "password" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("password")}
                >
                    Mật khẩu
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "otp"}
                    className={`customer-auth__tab ${activeTab === "otp" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("otp")}
                >
                    Mã OTP
                </button>
            </div>

            {activeTab === "password"
                ? <PasswordLoginTab idPrefix={idPrefix} />
                : <OtpLoginTab idPrefix={idPrefix} />}
        </div>
    );
}

export default MemberLoginForm;
