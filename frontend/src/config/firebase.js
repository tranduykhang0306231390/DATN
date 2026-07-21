import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/*
 * Cấu hình Firebase cho Phone Authentication. Không hard-code giá trị —
 * toàn bộ đọc từ biến môi trường Vite (xem frontend/.env.example).
 *
 * Các giá trị này (đặc biệt VITE_FIREBASE_API_KEY) không phải bí mật theo
 * đúng nghĩa "secret": Firebase Web API Key được thiết kế để xuất hiện
 * trong mã nguồn frontend công khai — bảo mật thực sự đến từ Firebase
 * Security Rules + App Check + reCAPTCHA, KHÔNG phải từ việc giấu key này.
 * Không dùng biến này ở Backend.
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!isFirebaseConfigured && import.meta.env.DEV) {
    console.warn(
        "Firebase chưa được cấu hình (thiếu VITE_FIREBASE_API_KEY/VITE_FIREBASE_PROJECT_ID). " +
        "Đăng ký/đăng nhập bằng OTP sẽ không hoạt động cho tới khi cấu hình .env.",
    );
}

// getApps() tránh gọi initializeApp() lần thứ hai khi Vite HMR reload module
// này trong lúc dev (initializeApp() ném lỗi "app already exists" nếu gọi
// lại với cùng tên app mặc định).
const firebaseApp = isFirebaseConfigured
    ? (getApps()[0] ?? initializeApp(firebaseConfig))
    : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

export { isFirebaseConfigured };
