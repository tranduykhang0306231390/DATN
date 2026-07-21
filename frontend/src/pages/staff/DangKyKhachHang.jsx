import { useRef, useState } from "react";
import Swal from "sweetalert2";

import staffKhachHangApi from "../../api/staffKhachHangApi";
import OtpInput from "../../components/customer/auth/OtpInput";
import useFirebasePhoneAuth from "../../hooks/useFirebasePhoneAuth";
import { MEMBER_NAME_PATTERN, PHONE_PATTERN } from "../../utils/auth";
import { getPreviousLocalCalendarDate } from "../../utils/customerDate";

const INITIAL_FORM = { HoTen: "", NgaySinh: "", GioiTinh: "Nam", SoDienThoai: "" };

export default function DangKyKhachHang() {
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
            const checkResponse = await staffKhachHangApi.checkPhone(phone);
            if (!checkResponse.data?.available) {
                setFieldErrors({ SoDienThoai: "Số điện thoại này đã được đăng ký." });
                return;
            }

            const sent = await sendOtp(phone);
            if (sent) setStep("otp");
        } catch (error) {
            setGeneralError(error?.response?.data?.message || "Không thể kiểm tra số điện thoại lúc này.");
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
            if (!idToken) return;

            await staffKhachHangApi.register({
                HoTen: form.HoTen.trim(),
                SoDienThoai: form.SoDienThoai.trim(),
                NgaySinh: form.NgaySinh,
                GioiTinh: form.GioiTinh,
                FirebaseIdToken: idToken,
            });

            await Swal.fire({
                icon: "success",
                title: "Đăng ký thành công",
                text: "Mật khẩu mặc định của khách hàng là chính số điện thoại vừa đăng ký.",
                timer: 2200,
                showConfirmButton: false,
            });

            setForm(INITIAL_FORM);
            setOtp("");
            resetFirebase();
            setStep("form");
        } catch (error) {
            const responseErrors = error?.response?.data?.errors;
            if (responseErrors && typeof responseErrors === "object") {
                setFieldErrors(
                    Object.fromEntries(
                        Object.entries(responseErrors).map(([field, messages]) => [
                            field,
                            Array.isArray(messages) ? messages[0] : String(messages),
                        ]),
                    ),
                );
                setStep("form");
            }
            setGeneralError(error?.response?.data?.message || "Không thể hoàn tất đăng ký lúc này.");
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Đăng ký tài khoản cho khách hàng</h2>
                <p style={styles.subtitle}>
                    Khách hàng vẫn phải tự nhập đúng mã OTP gửi tới số điện thoại của mình — bạn không thể bỏ qua bước này.
                </p>

                <div id={recaptchaContainerId} />

                {(generalError || firebaseError) && (
                    <div style={styles.error}>{generalError || firebaseError}</div>
                )}

                {step === "form" && (
                    <form onSubmit={handleSubmitForm}>
                        <div style={styles.field}>
                            <label style={styles.label}>Họ và tên</label>
                            <input
                                style={styles.input}
                                value={form.HoTen}
                                onChange={(event) => updateField("HoTen", event.target.value)}
                                disabled={submitting}
                            />
                            {fieldErrors.HoTen && <small style={styles.fieldError}>{fieldErrors.HoTen}</small>}
                        </div>

                        <div style={styles.row}>
                            <div style={{ ...styles.field, flex: 1 }}>
                                <label style={styles.label}>Ngày sinh</label>
                                <input
                                    style={styles.input}
                                    type="date"
                                    value={form.NgaySinh}
                                    max={maxBirthDate}
                                    onChange={(event) => updateField("NgaySinh", event.target.value)}
                                    disabled={submitting}
                                />
                                {fieldErrors.NgaySinh && <small style={styles.fieldError}>{fieldErrors.NgaySinh}</small>}
                            </div>

                            <div style={{ ...styles.field, flex: 1 }}>
                                <label style={styles.label}>Giới tính</label>
                                <select
                                    style={styles.input}
                                    value={form.GioiTinh}
                                    onChange={(event) => updateField("GioiTinh", event.target.value)}
                                    disabled={submitting}
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nu">Nữ</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Số điện thoại</label>
                            <input
                                style={styles.input}
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={form.SoDienThoai}
                                onChange={(event) => updateField("SoDienThoai", event.target.value)}
                                disabled={submitting}
                            />
                            <small style={styles.help}>
                                Mật khẩu mặc định của khách hàng sẽ là chính số điện thoại này.
                            </small>
                            {fieldErrors.SoDienThoai && <small style={styles.fieldError}>{fieldErrors.SoDienThoai}</small>}
                        </div>

                        <button type="submit" style={styles.button} disabled={submitting}>
                            {submitting ? "Đang gửi mã OTP…" : "Gửi mã OTP cho khách hàng"}
                        </button>
                    </form>
                )}

                {step === "otp" && (
                    <form onSubmit={handleSubmitOtp}>
                        <p style={styles.help}>
                            Mã OTP đã được gửi tới số <strong>{form.SoDienThoai}</strong>. Hãy nhờ khách hàng đọc mã để nhập vào ô bên dưới.
                        </p>

                        <OtpInput value={otp} onChange={setOtp} disabled={submitting || isConfirming} idPrefix="staff-register-otp" />

                        <div style={styles.row}>
                            <button type="button" style={styles.linkButton} onClick={handleChangePhone} disabled={submitting}>
                                Đổi số điện thoại
                            </button>
                            <button
                                type="button"
                                style={styles.linkButton}
                                onClick={handleResend}
                                disabled={!canResend || isSending || submitting}
                            >
                                {canResend ? "Gửi lại mã" : `Gửi lại sau ${resendAvailableIn}s`}
                            </button>
                        </div>

                        <button
                            type="submit"
                            style={styles.button}
                            disabled={submitting || isConfirming || otp.length !== 6}
                        >
                            {submitting || isConfirming ? "Đang xác minh…" : "Xác nhận & Tạo tài khoản"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { padding: 24 },
    card: {
        maxWidth: 560,
        background: "#fff",
        borderRadius: 12,
        padding: 28,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    },
    title: { margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" },
    subtitle: { marginTop: 6, marginBottom: 20, fontSize: 13, color: "#6b7280" },
    field: { marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 },
    row: { display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 8 },
    label: { fontSize: 13, fontWeight: 600, color: "#374151" },
    input: {
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        fontSize: 14,
    },
    help: { fontSize: 12, color: "#6b7280" },
    fieldError: { fontSize: 12, color: "#dc2626", fontWeight: 600 },
    error: {
        padding: "10px 14px",
        borderRadius: 8,
        background: "#fee2e2",
        color: "#b91c1c",
        fontSize: 13,
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        padding: "10px 18px",
        borderRadius: 8,
        border: "none",
        background: "#3b82f6",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
    },
    linkButton: {
        background: "none",
        border: "none",
        color: "#2563eb",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        padding: 0,
    },
};
