// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginMember    from "./pages/auth/LoginMember";
import LoginStaff     from "./pages/auth/LoginStaff";
import Home           from "./pages/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import MemberHome     from "./pages/member/MemberHome";
import Register       from "./pages/auth/Register";
import TaoHoaDon      from "./pages/staff/TaoHoaDon";
import PrivateRoute   from "./routes/PrivateRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ── Công khai ───────────────────────────────── */}
                <Route path="/"             element={<Home />} />
                <Route path="/login"        element={<LoginMember />} />
                <Route path="/staff/login"  element={<LoginStaff />} />
                <Route path="/register"     element={<Register />} />

                {/* ── Thành viên ──────────────────────────────── */}
                <Route
                    path="/member/home"
                    element={
                        <PrivateRoute allowedRoles={["member"]}>
                            <MemberHome />
                        </PrivateRoute>
                    }
                />

                {/* ── Nhân viên ───────────────────────────────── */}
                <Route
                    path="/staff/dashboard"
                    element={
                        <PrivateRoute allowedRoles={["Admin", "NhanVien"]}>
                            <StaffDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/staff/tao-hoa-don"
                    element={
                        <PrivateRoute allowedRoles={["Admin", "NhanVien"]}>
                            <TaoHoaDon />
                        </PrivateRoute>
                    }
                />

                {/* ── Admin ───────────────────────────────────── */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                            <AdminDashboard />
                        </PrivateRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;