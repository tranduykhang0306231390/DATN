// Chuyển mã lỗi Firebase Auth sang thông báo tiếng Việt thân thiện.
// Không bao giờ hiển thị error.message (chi tiết kỹ thuật) thẳng cho người dùng.
const MESSAGES = {
    "auth/invalid-phone-number": "Số điện thoại không hợp lệ.",
    "auth/missing-phone-number": "Vui lòng nhập số điện thoại.",
    "auth/too-many-requests": "Bạn đã yêu cầu quá nhiều lần, vui lòng thử lại sau.",
    "auth/quota-exceeded": "Hệ thống xác thực đã đạt giới hạn, vui lòng thử lại sau.",
    "auth/invalid-verification-code": "Mã OTP không chính xác.",
    "auth/code-expired": "Mã OTP đã hết hạn, vui lòng gửi lại mã mới.",
    "auth/captcha-check-failed": "Xác minh reCAPTCHA thất bại, vui lòng thử lại.",
    "auth/network-request-failed": "Không thể kết nối dịch vụ xác thực. Vui lòng kiểm tra mạng.",
    "auth/user-disabled": "Số điện thoại này đã bị vô hiệu hóa xác thực.",
    "auth/internal-error": "Không thể xác thực lúc này. Vui lòng thử lại.",
};

export const getFirebaseAuthErrorMessage = (error, fallback = "Không thể xác thực lúc này. Vui lòng thử lại.") => {
    const code = error?.code;
    if (typeof code === "string" && MESSAGES[code]) {
        return MESSAGES[code];
    }
    return fallback;
};
