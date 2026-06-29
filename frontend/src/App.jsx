import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";

import LoginMember from "./pages/auth/LoginMember";
import LoginStaff  from "./pages/auth/LoginStaff";
import Register    from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";

import MemberLayout from "./layouts/MemberLayout";
import MemberHome   from "./pages/member/MemberHome";
import Profile      from "./pages/member/Profile";
import Points       from "./pages/member/Points";

import { MemberRoute, StaffRoute, AdminRoute } from "./routes/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ── Public ── */}
                <Route path="/"             element={<Home />} />
                <Route path="/login"        element={<LoginMember />} />
                <Route path="/member/login" element={<LoginMember />} />
                <Route path="/register"     element={<Register />} />
                <Route path="/staff/login"  element={<LoginStaff />} />

                {/* ── Vùng MEMBER ── */}
                <Route
                    path="/member"
                    element={
                        <MemberRoute>
                            <MemberLayout />
                        </MemberRoute>
                    }
                >
                    <Route index          element={<MemberHome />} />
                    <Route path="home"    element={<MemberHome />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="points"  element={<Points />} />
                    {/* Thêm route member ở đây */}
                </Route>

                {/* ── Vùng STAFF ── */}
                <Route
                    path="/staff/dashboard"
                    element={
                        <StaffRoute>
                            <StaffDashboard />
                        </StaffRoute>
                    }
                />
                {/* Thêm route staff ở đây */}

                {/* ── Vùng ADMIN ── */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
                {/* Thêm route admin ở đây */}

            </Routes>
        </BrowserRouter>
    );
}

export default App;