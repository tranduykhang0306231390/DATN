import { BrowserRouter, Routes, Route } from "react-router-dom";

// ================= PUBLIC PAGES =================
import Home from "./pages/Home";
import LoginMember from "./pages/auth/LoginMember";
import LoginStaff from "./pages/auth/LoginStaff";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
// ================= MEMBER =================
import MemberLayout from "./layouts/MemberLayout";
import MemberHome from "./pages/member/MemberHome";
import MemberRank from "./pages/member/MemberRank";
import Ticket from "./pages/member/Ticket";
import Voucher from "./pages/member/Voucher";
import Invoice from "./pages/member/Invoice";

// ================= STAFF =================
import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import TaoHoaDon from "./pages/staff/TaoHoaDon";
import QuanLyHoaDon from "./pages/staff/QuanLyHoaDon"



// ================= ADMIN =================
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from "./pages/admin/AdminDashboard";
import QuanLyUuDai from './pages/admin/QuanLyUuDai';
import QuanLyLoaiVe from './pages/admin/QuanLyLoaiVe';
import QuanLyQuyTac from './pages/admin/QuanLyQuyTac';
import QuanLyHangThanhVien from './pages/admin/QuanLyHangThanhVien';
import QuanLyNhanVien from './pages/admin/QuanLyNhanVien';
import QuanLyKhachHang from './pages/admin/QuanLyKhachHang';
import LichSuQuyTac from './pages/admin/LichSuQuyTac';
import LichSuHang from './pages/admin/LichSuHang';
import LichSuDiem from './pages/admin/LichSuDiem';
import QuanLyThongBao from './pages/admin/QuanLyThongBao';
import QuanLyPhanHoi from './pages/admin/QuanLyPhanHoi';
import ThongKe from "./pages/admin/ThongKe";
import QuanLyHoaDonAdmin from "./pages/admin/QuanLyHoaDon";
import CauHinhWebsite from "./pages/admin/CauHinhWebsite";




// ================= PROTECTED ROUTES =================
import {
    MemberRoute,
    StaffRoute,
    AdminRoute,
} from "./routes/ProtectedRoute";
;
import PublicLayout from "./layouts/PublicLayout";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ---------------- PUBLIC ROUTES ---------------- */}
                <Route element={<PublicLayout />}>

                    <Route
                        path="/"
                        element={<Home />}
                    />

                </Route>

                <Route path="/login" element={<LoginMember />} />
                <Route path="/member/login" element={<LoginMember />} />
                <Route path="/register" element={<Register />} />
                <Route path="/staff/login" element={<LoginStaff />} />
                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />
                {/* ---------------- MEMBER ROUTES ---------------- */}
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
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route
                        path="/admin/dashboard"
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/uu-dai"
                        element={
                            <AdminRoute>
                                <QuanLyUuDai />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/loai-ve"
                        element={
                            <AdminRoute>
                                <QuanLyLoaiVe />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/quy-tac"
                        element={
                            <AdminRoute>
                                <QuanLyQuyTac />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/hang-thanh-vien"
                        element={
                            <AdminRoute>
                                <QuanLyHangThanhVien />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/nhan-vien"
                        element={
                            <AdminRoute>
                                <QuanLyNhanVien />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/khach-hang"
                        element={
                            <AdminRoute>
                                <QuanLyKhachHang />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/lich-su-quy-tac"
                        element={
                            <AdminRoute>
                                <LichSuQuyTac />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/lich-su-hang"
                        element={
                            <AdminRoute>
                                <LichSuHang />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/lich-su-diem"
                        element={
                            <AdminRoute>
                                <LichSuDiem />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/thong-bao"
                        element={
                            <AdminRoute>
                                <QuanLyThongBao />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/phan-hoi"
                        element={
                            <AdminRoute>
                                <QuanLyPhanHoi />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/thong-ke"
                        element={
                            <AdminRoute>
                                <ThongKe />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="quan-ly-hoa-don"
                        element={
                            <AdminRoute>
                                <QuanLyHoaDonAdmin />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/cau-hinh-website"
                        element={
                            <AdminRoute>
                                <CauHinhWebsite />
                            </AdminRoute>
                        }
                    />



                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;