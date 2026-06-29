import { Navigate } from "react-router-dom";

const getRole = () => localStorage.getItem("role");
const getToken = () => localStorage.getItem("token");

export function MemberRoute({ children }) {
    const token = getToken();
    const role = getRole();

    if (!token) return <Navigate to="/login" replace />;
    if (role !== "member") return <Navigate to="/login" replace />;

    return children;
}

export function StaffRoute({ children }) {
    const token = getToken();
    const role = getRole();

    if (!token) return <Navigate to="/staff/login" replace />;
    if (role !== "Admin" && role !== "NhanVien") return <Navigate to="/staff/login" replace />;

    return children;
}

export function AdminRoute({ children }) {
    const token = getToken();
    const role = getRole();

    if (!token) return <Navigate to="/staff/login" replace />;
    if (role === "NhanVien") return <Navigate to="/staff/dashboard" replace />;
    if (role !== "Admin") return <Navigate to="/staff/login" replace />;

    return children;
}