// src/routes/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

/**
 * Bảo vệ route theo role.
 * allowedRoles: mảng role được phép, vd ["Admin", "NhanVien"] hoặc ["member"]
 * Nếu chưa đăng nhập hoặc sai role → redirect về trang login tương ứng
 */
function PrivateRoute({ children, allowedRoles }) {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");

    if (!token || !role) {
        const isStaffRoute = allowedRoles.some(
            (r) => r === "Admin" || r === "NhanVien"
        );
        return <Navigate to={isStaffRoute ? "/staff/login" : "/login"} replace />;
    }

    if (!allowedRoles.includes(role)) {
        if (role === "Admin")    return <Navigate to="/admin/dashboard" replace />;
        if (role === "NhanVien") return <Navigate to="/staff/dashboard" replace />;
        if (role === "member")   return <Navigate to="/member/home"     replace />;
        return <Navigate to="/" replace />;
    }

    return children;
}

export default PrivateRoute;