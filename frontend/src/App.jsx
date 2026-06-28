import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";

import LoginMember from "./pages/auth/LoginMember";
import LoginStaff from "./pages/auth/LoginStaff";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";

import MemberLayout from "./layouts/MemberLayout";
import MemberHome from "./pages/member/MemberHome";
import Profile from "./pages/member/Profile";
import Points from "./pages/member/Points";
function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* Trang chủ */}
                <Route
                    path="/"
                    element={<Home />}
                />

                {/* Khách hàng */}
                <Route
                    path="/login"
                    element={<LoginMember />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Staff */}
                <Route
                    path="/staff/login"
                    element={<LoginStaff />}
                />

                {/* Layout dành cho Member */}
                <Route
                    path="/member"
                    element={<MemberLayout />}
                >

                    <Route
                        index
                        element={<MemberHome />}
                    />

                    <Route
                        path="home"
                        element={<MemberHome />}
                    />

                    <Route
                        path="profile"
                        element={<Profile />}
                    />
                    <Route
                        path="points"
                        element={<Points />}
                    />
                </Route>

                {/* Dashboard */}
                <Route
                    path="/staff/dashboard"
                    element={<StaffDashboard />}
                />

                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;