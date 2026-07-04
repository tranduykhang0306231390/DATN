import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

// --- IMPORT PAGES ---
import Home from "./pages/Home";
import LoginMember from "./pages/auth/LoginMember";
import LoginStaff from "./pages/auth/LoginStaff";
import Register from "./pages/auth/Register";
import MemberHome from "./pages/member/MemberHome"
import StaffDashboard from "./pages/staff/StaffDashboard";
import TaoHoaDon from "./pages/staff/TaoHoaDon";

import AdminDashboard from "./pages/admin/AdminDashboard";

import StaffLayout from "./layouts/StaffLayout";
import { 
    MemberRoute, 
    StaffRoute, 
    AdminRoute 
} from "./routes/ProtectedRoute";
import QuanLyHoaDon from "./pages/staff/QuanLyHoaDon";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ---------------- PUBLIC ROUTES ---------------- */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginMember />} />
                <Route path="/member/login" element={<LoginMember />} />
                <Route path="/register" element={<Register />} />
                <Route path="/staff/login" element={<LoginStaff />} />

                {/* ---------------- MEMBER ROUTES ---------------- */}
                <Route
                    path="/member"
                    element={
                        <MemberRoute>
                            <MemberHome />
                        </MemberRoute>
                    }
                />

                {/* ---------------- STAFF ROUTES ---------------- */}
                <Route
                    element={
                        <StaffRoute>
                            <StaffLayout />
                        </StaffRoute>
                    }
                >
                    <Route
                        path="/staff/dashboard"
                        element={<StaffDashboard />}
                    />

                    <Route
                        path="/staff/tao-hoa-don"
                        element={<TaoHoaDon />}
                    />

                    <Route
                        path="/staff/quan-ly-hoa-don"
                        element={
                            <QuanLyHoaDon />
                        }
                    />
                </Route>

                {/* ---------------- ADMIN ROUTES ---------------- */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;