import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginMember from "./pages/auth/LoginMember";
import LoginStaff from "./pages/auth/LoginStaff";
import Home from "./pages/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import MemberHome from "./pages/member/MemberHome";
import Register from "./pages/auth/Register";
function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Khách hàng */}
                <Route
                    path="/login"
                    element={<LoginMember />}
                />

                {/* Nhân viên/Admin */}
                <Route
                    path="/staff/login"
                    element={<LoginStaff />}
                />

                <Route
                    path="/member/home"
                    element={<MemberHome />}
                />

                <Route
                    path="/staff/dashboard"
                    element={<StaffDashboard />}
                />

                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                />
                <Route
                    path="/register"
                    element={<Register />}
                />
                <Route path="/" element={<Home />} />


            </Routes>
        </BrowserRouter>
    );
}

export default App;