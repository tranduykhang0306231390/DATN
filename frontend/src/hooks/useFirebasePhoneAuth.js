import { useCallback, useEffect, useId, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

import { firebaseAuth, isFirebaseConfigured } from "../config/firebase";
import { getFirebaseAuthErrorMessage } from "../utils/firebaseAuthErrors";
import { toE164 } from "../utils/phone";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Hook dùng chung cho MỌI luồng cần gửi + xác minh OTP qua Firebase Phone
 * Auth: đăng ký, nhân viên đăng ký hộ, đăng nhập OTP, quên mật khẩu, đổi
 * mật khẩu. Không copy-paste logic Firebase/reCAPTCHA ra từng trang.
 *
 * Trả về Firebase ID Token (chuỗi) sau khi xác minh OTP thành công — component
 * gọi API Laravel là nơi DUY NHẤT dùng token này, hook không tự gọi backend.
 */
export default function useFirebasePhoneAuth() {
    // Mỗi hook instance cần 1 container reCAPTCHA riêng (invisible, không
    // hiển thị UI) để tránh 2 verifier tranh nhau cùng 1 phần tử DOM.
    // useId() cho một id ổn định, duy nhất trên toàn trang, không cần biến
    // đếm ở module-level (vốn là side-effect không thuần trong lúc render).
    const reactId = useId();
    const recaptchaContainerId = `firebase-recaptcha-${reactId.replace(/:/g, "")}`;

    const verifierRef = useRef(null);
    const confirmationRef = useRef(null);

    const [isSending, setIsSending] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [otpSentTo, setOtpSentTo] = useState(null);
    const [resendAvailableIn, setResendAvailableIn] = useState(0);

    useEffect(() => {
        if (resendAvailableIn <= 0) return undefined;
        const timer = setInterval(() => {
            setResendAvailableIn((current) => Math.max(0, current - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendAvailableIn]);

    const clearVerifier = useCallback(() => {
        try {
            verifierRef.current?.clear();
        } catch {
            // Bỏ qua nếu verifier đã bị hủy trước đó.
        }
        verifierRef.current = null;
    }, []);

    // Luôn dọn reCAPTCHA khi rời trang/unmount component.
    useEffect(() => clearVerifier, [clearVerifier]);

    const getOrCreateVerifier = useCallback(() => {
        if (verifierRef.current) return verifierRef.current;

        verifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaContainerId, {
            size: "invisible",
        });

        return verifierRef.current;
    }, [recaptchaContainerId]);

    const sendOtp = useCallback(async (phoneInStorageFormat) => {
        setErrorMessage("");

        if (!isFirebaseConfigured) {
            setErrorMessage("Dịch vụ xác thực OTP chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
            return false;
        }

        const phoneE164 = toE164(phoneInStorageFormat);
        if (!phoneE164) {
            setErrorMessage("Số điện thoại không hợp lệ.");
            return false;
        }

        setIsSending(true);
        try {
            const verifier = getOrCreateVerifier();
            confirmationRef.current = await signInWithPhoneNumber(firebaseAuth, phoneE164, verifier);
            setOtpSentTo(phoneInStorageFormat);
            setResendAvailableIn(RESEND_COOLDOWN_SECONDS);
            return true;
        } catch (error) {
            setErrorMessage(getFirebaseAuthErrorMessage(error));
            // reCAPTCHA (kể cả invisible) chỉ dùng được 1 lần cho 1 lượt thử;
            // phải hủy để lần gửi lại sau tạo verifier mới, tránh lỗi
            // "reCAPTCHA has already been rendered".
            clearVerifier();
            return false;
        } finally {
            setIsSending(false);
        }
    }, [clearVerifier, getOrCreateVerifier]);

    const confirmOtp = useCallback(async (code) => {
        setErrorMessage("");

        if (!confirmationRef.current) {
            setErrorMessage("Vui lòng gửi mã OTP trước.");
            return null;
        }

        setIsConfirming(true);
        try {
            const credential = await confirmationRef.current.confirm(code);
            return await credential.user.getIdToken();
        } catch (error) {
            setErrorMessage(getFirebaseAuthErrorMessage(error));
            return null;
        } finally {
            setIsConfirming(false);
        }
    }, []);

    const reset = useCallback(() => {
        confirmationRef.current = null;
        setOtpSentTo(null);
        setResendAvailableIn(0);
        setErrorMessage("");
        clearVerifier();
    }, [clearVerifier]);

    return {
        recaptchaContainerId,
        sendOtp,
        confirmOtp,
        reset,
        isSending,
        isConfirming,
        errorMessage,
        otpSentTo,
        resendAvailableIn,
        canResend: resendAvailableIn <= 0,
    };
}
