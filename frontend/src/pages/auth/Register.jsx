import { useRef, useState } from "react";
import { FaArrowLeft, FaGift } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { checkPhoneAvailable, registerMember } from "../../api/authApi";
import {
    AuthMessage,
    CustomerAuthLayout,
    OtpInput,
} from "../../components/customer/auth";
import useFirebasePhoneAuth from "../../hooks/useFirebasePhoneAuth";
import {
    getAuthRequestMessage,
    MEMBER_NAME_PATTERN,
    normalizeFieldErrors,
    PHONE_PATTERN,
} from "../../utils/auth";
import { getPreviousLocalCalendarDate } from "../../utils/customerDate";

const INITIAL_FORM = {
    HoTen: "",
    NgaySinh: "",
    GioiTinh: "Nam",
    SoDienThoai: "",
};

function Register() {
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const [step, setStep] = useState("form"); // 'form' | 'otp'
    const [form, setForm] = useState(INITIAL_FORM);
    const [otp, setOtp] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const maxBirthDate = getPreviousLocalCalendarDate();

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

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: "" }));
        setGeneralError("");
    };

    const validateForm = () => {
        const errors = {};
        const fullName = form.HoTen.trim();
        const phone = form.SoDienThoai.trim();

        if (!fullName) errors.HoTen = "Họ tên không được để trống.";
        else if (fullName.length < 3) errors.HoTen = "Họ tên phải từ 3 ký tự.";
        else if (fullName.length > 100) errors.HoTen = "Họ tên không quá 100 ký tự.";
        else if (!MEMBER_NAME_PATTERN.test(fullName)) errors.HoTen = "Họ tên chỉ gồm chữ cái và khoảng trắng.";

        if (!form.NgaySinh) errors.NgaySinh = "Ngày sinh không được để trống.";
        else if (form.NgaySinh > maxBirthDate) errors.NgaySinh = "Ngày sinh phải trước ngày hôm nay.";

        if (!["Nam", "Nu"].includes(form.GioiTinh)) errors.GioiTinh = "Vui lòng chọn giới tính.";

        if (!phone) errors.SoDienThoai = "Số điện thoại không được để trống.";
        else if (!PHONE_PATTERN.test(phone)) errors.SoDienThoai = "Số điện thoại phải gồm 10 số và bắt đầu bằng 0.";

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitForm = async (event) => {
        event.preventDefault();
        if (submittingRef.current || !validateForm()) return;

        submittingRef.current = true;
        setSubmitting(true);
        setGeneralError("");

        try {
            const phone = form.SoDienThoai.trim();
            const checkResponse = await checkPhoneAvailable(phone);
            if (!checkResponse.data?.available) {
                setFieldErrors({ SoDienThoai: "Số điện thoại này đã được đăng ký." });
                return;
            }

            const sent = await sendOtp(phone);
            if (sent) setStep("otp");
        } catch (error) {
            const responseErrors = normalizeFieldErrors(error);
            const hasFieldErrors = Object.keys(responseErrors).length > 0;
            if (hasFieldErrors) setFieldErrors(responseErrors);
            setGeneralError(hasFieldErrors
                ? "Vui lòng kiểm tra lại các trường được đánh dấu."
                : getAuthRequestMessage(error, "Không thể kiểm tra số điện thoại lúc này."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!canResend || isSending) return;
        await sendOtp(form.SoDienThoai.trim());
        setOtp("");
    };

    const handleChangePhone = () => {
        resetFirebase();
        setOtp("");
        setStep("form");
    };

    const handleSubmitOtp = async (event) => {
        event.preventDefault();
        if (submittingRef.current || otp.length !== 6) return;

        submittingRef.current = true;
        setSubmitting(true);
        setGeneralError("");

        try {
            const idToken = await confirmOtp(otp);
            if (!idToken) return; // lỗi Firebase đã hiển thị qua firebaseError

            await registerMember({
                HoTen: form.HoTen.trim(),
                SoDienThoai: form.SoDienThoai.trim(),
                NgaySinh: form.NgaySinh,
                GioiTinh: form.GioiTinh,
                FirebaseIdToken: idToken,
            });

            await Swal.fire({
                icon: "success",
                title: "Đăng ký thành công",
                text: "Mật khẩu mặc định là chính số điện thoại của bạn. Hãy đổi mật khẩu sau khi đăng nhập.",
                timer: 2200,
                showConfirmButton: false,
            });
            navigate("/member/login", { replace: true });
        } catch (error) {
            const responseErrors = normalizeFieldErrors(error);
            const hasFieldErrors = Object.keys(responseErrors).length > 0;
            if (hasFieldErrors) {
                setFieldErrors(responseErrors);
                // Số điện thoại bị từ chối ở phút chót (ví dụ trùng do race
                // condition) -> quay lại bước nhập để khách sửa lại.
                if (responseErrors.SoDienThoai) setStep("form");
            }
            setGeneralError(hasFieldErrors
                ? "Vui lòng kiểm tra lại các trường được đánh dấu."
                : getAuthRequestMessage(error, "Không thể hoàn tất đăng ký lúc này."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <CustomerAuthLayout
            eyebrow="Bắt đầu hành trình"
            title="Đăng ký thành viên"
            description="Tạo tài khoản bằng số điện thoại để tích điểm và nhận quyền lợi theo hạng."
            footer={(
                <span>
                    Đã có tài khoản? <Link to="/member/login">Đăng nhập</Link>
                </span>
            )}
        >
            {/* Container reCAPTCHA vô hình — Firebase tự quản lý, không hiển thị UI. */}
            <div id={recaptchaContainerId} />

            {step === "form" && (
                <form className="customer-auth__form" onSubmit={handleSubmitForm} noValidate>
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
                                disabled={submitting}
                                required
                            />
                            {fieldErrors.HoTen && <small className="customer-auth__error">{fieldErrors.HoTen}</small>}
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
                                disabled={submitting}
                                required
                            />
                            {fieldErrors.NgaySinh && <small className="customer-auth__error">{fieldErrors.NgaySinh}</small>}
                        </div>

                        <div className="customer-auth__field">
                            <label htmlFor="register-gender">Giới tính</label>
                            <select
                                id="register-gender"
                                name="GioiTinh"
                                className="customer-select customer-auth__select"
                                value={form.GioiTinh}
                                onChange={(event) => updateField("GioiTinh", event.target.value)}
                                disabled={submitting}
                                required
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nu">Nữ</option>
                            </select>
                            {fieldErrors.GioiTinh && <small className="customer-auth__error">{fieldErrors.GioiTinh}</small>}
                        </div>
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
                            disabled={submitting}
                            required
                        />
                        <small className="customer-form-field__help">
                            Đây sẽ là tài khoản đăng nhập của bạn. Mật khẩu ban đầu chính là số điện thoại này.
                        </small>
                        {fieldErrors.SoDienThoai && <small className="customer-auth__error">{fieldErrors.SoDienThoai}</small>}
                    </div>

                    <button
                        className="customer-button customer-button--primary customer-auth__submit"
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <><span className="customer-auth__submit-spinner" aria-hidden="true" /> Đang gửi mã OTP…</>
                        ) : (
                            <><FaGift aria-hidden="true" /> Gửi mã xác thực</>
                        )}
                    </button>
                </form>
            )}

            {step === "otp" && (
                <form className="customer-auth__form" onSubmit={handleSubmitOtp} noValidate>
                    <AuthMessage message={generalError || firebaseError} />

                    <p className="customer-form-field__help">
                        Mã OTP đã được gửi tới số <strong>{form.SoDienThoai}</strong>.
                    </p>

                    <OtpInput value={otp} onChange={setOtp} disabled={submitting || isConfirming} idPrefix="register-otp" />

                    <div className="customer-auth__meta-row">
                        <button
                            type="button"
                            className="customer-auth__link"
                            onClick={handleChangePhone}
                            disabled={submitting}
                        >
                            <FaArrowLeft aria-hidden="true" /> Đổi số điện thoại
                        </button>

                        <button
                            type="button"
                            className="customer-auth__link"
                            onClick={handleResend}
                            disabled={!canResend || isSending || submitting}
                        >
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
                            <><FaGift aria-hidden="true" /> Xác nhận & Đăng ký</>
                        )}
                    </button>
                </form>
            )}
        </CustomerAuthLayout>
    );
}

export default Register;
