import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

import LoginMember from "./pages/auth/LoginMember";
import LoginStaff from "./pages/auth/LoginStaff";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/AdminDashboard";

import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import TaoHoaDon from "./pages/staff/TaoHoaDon";

import MemberLayout from "./layouts/MemberLayout";
import MemberHome from "./pages/member/MemberHome";
import MemberRank from "./pages/member/MemberRank";
import Ticket from "./pages/member/Ticket";
import Voucher from "./pages/member/Voucher";
import Invoice from "./pages/member/Invoice";
import {
    MemberRoute,
    StaffRoute,
    AdminRoute,
} from "./routes/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginMember />} />
                <Route path="/member/login" element={<LoginMember />} />
                <Route path="/register" element={<Register />} />
                <Route path="/staff/login" element={<LoginStaff />} />

                {/* MEMBER */}
                <Route
                    path="/member"
                    element={
                        <MemberRoute>
                            <MemberLayout />
                        </MemberRoute>
                    }
                >
                    <Route index element={<MemberHome />} />

                    <Route path="home" element={<MemberHome />} />

                    <Route path="rank" element={<MemberRank />} />

                    <Route path="ticket" element={<Ticket />} />
                    <Route path="voucher" element={<Voucher />} />
                    <Route path="invoice" element={<Invoice />} />

                </Route>

                {/* STAFF */}
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
                            <div style={{ padding: 32 }}>
                                <h2>Quản lý hóa đơn</h2>
                            </div>
                        }
                    />
                </Route>

                {/* ADMIN */}
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