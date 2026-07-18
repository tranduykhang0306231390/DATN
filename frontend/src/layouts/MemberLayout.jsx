import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { logoutSession } from "../api/authApi";
import NotificationBell from "../components/member/NotificationBell";
import CustomerLayout from "../components/customer/layout/CustomerLayout";
import { resetSessionVerificationCache } from "../services/sessionService";
import {
    clearAuthSession,
    CUSTOMER_USER_UPDATED_EVENT,
    getStoredCustomerUser,
} from "../utils/customerSession";

function MemberLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => getStoredCustomerUser());
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const logoutPendingRef = useRef(false);

    useEffect(() => {
        const handleUserUpdate = (event) => {
            setUser(event.detail || getStoredCustomerUser());
        };
        const handleStorage = (event) => {
            if (event.key === "user") setUser(getStoredCustomerUser());
        };

        window.addEventListener(CUSTOMER_USER_UPDATED_EVENT, handleUserUpdate);
        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener(CUSTOMER_USER_UPDATED_EVENT, handleUserUpdate);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    const handleLogout = async () => {
        if (logoutPendingRef.current) return;
        logoutPendingRef.current = true;

        const result = await Swal.fire({
            title: "Đăng xuất",
            text: "Bạn có muốn đăng xuất không?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đăng xuất",
            cancelButtonText: "Hủy",
        });

        if (!result.isConfirmed) {
            logoutPendingRef.current = false;
            return;
        }

        setIsLoggingOut(true);
        let serverLogoutFailed = false;

        try {
            await logoutSession();
        } catch {
            serverLogoutFailed = true;
        } finally {
            clearAuthSession();
            resetSessionVerificationCache();
            navigate("/", { replace: true });
        }

        if (serverLogoutFailed) {
            void Swal.fire({
                icon: "info",
                title: "Đã đăng xuất trên thiết bị",
                text: "Không thể kết nối máy chủ để thu hồi phiên, nhưng dữ liệu đăng nhập cục bộ đã được xóa.",
            });
        }
    };

    return (
        <CustomerLayout
            isAuthenticated
            user={user}
            notificationSlot={<NotificationBell />}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
        >
            <Outlet />
        </CustomerLayout>
    );
}

export default MemberLayout;
