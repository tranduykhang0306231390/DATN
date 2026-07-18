import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { verifyStoredSession } from "../services/sessionService";
import { getRoleHomePath } from "../utils/auth";
import { clearAuthSession, getStoredAuthToken } from "../utils/customerSession";
import "../assets/css/customer/session-gate.css";

const useVerifiedSession = () => {
    const [attempt, setAttempt] = useState(0);
    const [session, setSession] = useState(() => (
        getStoredAuthToken()
            ? { status: "checking", role: null, user: null }
            : { status: "unauthenticated", role: null, user: null }
    ));

    useEffect(() => {
        let isActive = true;

        verifyStoredSession({ force: attempt > 0 }).then((result) => {
            if (isActive) setSession(result);
        });

        return () => {
            isActive = false;
        };
    }, [attempt]);

    return {
        session,
        retry: () => {
            setSession((current) => ({ ...current, status: "checking" }));
            setAttempt((current) => current + 1);
        },
    };
};

function SessionBoundary({ status, onRetry, accountPath = "/login" }) {
    const navigate = useNavigate();
    const isUnavailable = status === "unavailable";

    const handleUseAnotherAccount = () => {
        clearAuthSession();
        navigate(accountPath, { replace: true });
    };

    return (
        <main className="customer-app customer-session-boundary">
            <section
                className="customer-session-boundary__card"
                aria-live="polite"
                aria-busy={!isUnavailable}
            >
                {!isUnavailable && <span className="customer-session-boundary__spinner" aria-hidden="true" />}
                <p className="customer-session-boundary__eyebrow">
                    {isUnavailable ? "Kết nối gián đoạn" : "Đang kiểm tra phiên"}
                </p>
                <h1>
                    {isUnavailable
                        ? "Chưa thể xác minh phiên đăng nhập"
                        : "Vui lòng chờ trong giây lát"}
                </h1>
                <p>
                    {isUnavailable
                        ? "Máy chủ chưa phản hồi. Nội dung tài khoản được giữ kín cho đến khi phiên được xác minh."
                        : "Hệ thống đang xác minh tài khoản trước khi hiển thị nội dung."}
                </p>

                {isUnavailable && (
                    <div className="customer-session-boundary__actions">
                        <button type="button" onClick={onRetry}>Thử lại</button>
                        <button type="button" className="is-secondary" onClick={handleUseAnotherAccount}>
                            Dùng tài khoản khác
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}

function ProtectedRoute({ children, allowedRoles, loginPath }) {
    const location = useLocation();
    const { session, retry } = useVerifiedSession();

    if (session.status === "checking" || session.status === "unavailable") {
        return (
            <SessionBoundary
                status={session.status}
                onRetry={retry}
                accountPath={loginPath}
            />
        );
    }

    if (session.status !== "authenticated") {
        return (
            <Navigate
                to={loginPath}
                replace
                state={{ from: `${location.pathname}${location.search}${location.hash}` }}
            />
        );
    }

    if (!allowedRoles.includes(session.role)) {
        return <Navigate to={getRoleHomePath(session.role) || loginPath} replace />;
    }

    return children;
}

export function GuestRoute({ children }) {
    const location = useLocation();
    const { session, retry } = useVerifiedSession();

    if (session.status === "checking" || session.status === "unavailable") {
        return (
            <SessionBoundary
                status={session.status}
                onRetry={retry}
                accountPath={location.pathname}
            />
        );
    }

    if (session.status === "authenticated") {
        return <Navigate to={getRoleHomePath(session.role) || "/"} replace />;
    }

    return children;
}

export function MemberRoute({ children }) {
    return (
        <ProtectedRoute allowedRoles={["member"]} loginPath="/login">
            {children}
        </ProtectedRoute>
    );
}

export function StaffRoute({ children }) {
    return (
        <ProtectedRoute allowedRoles={["Admin", "NhanVien"]} loginPath="/staff/login">
            {children}
        </ProtectedRoute>
    );
}

export function AdminRoute({ children }) {
    return (
        <ProtectedRoute allowedRoles={["Admin"]} loginPath="/staff/login">
            {children}
        </ProtectedRoute>
    );
}
