import { lazy, Suspense } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

// ================= PUBLIC PAGES =================
const Home = lazy(() => import("./pages/Home"));
const LoginMember = lazy(() => import("./pages/auth/LoginMember"));
const LoginStaff = lazy(() => import("./pages/auth/LoginStaff"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
// ================= MEMBER =================
const MemberLayout = lazy(() => import("./layouts/MemberLayout"));
const MemberRank = lazy(() => import("./pages/member/MemberRank"));

// ================= STAFF =================
const StaffLayout = lazy(() => import("./layouts/StaffLayout"));
const StaffDashboard = lazy(() => import("./pages/staff/StaffDashboard"));
const TaoHoaDon = lazy(() => import("./pages/staff/TaoHoaDon"));
const QuanLyHoaDon = lazy(() => import("./pages/staff/QuanLyHoaDon"));

// ================= ADMIN =================
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const QuanLyUuDai = lazy(() => import("./pages/admin/QuanLyUuDai"));
const QuanLyLoaiVe = lazy(() => import("./pages/admin/QuanLyLoaiVe"));
const QuanLyQuyTac = lazy(() => import("./pages/admin/QuanLyQuyTac"));
const QuanLyHangThanhVien = lazy(() => import("./pages/admin/QuanLyHangThanhVien"));
const QuanLyNhanVien = lazy(() => import("./pages/admin/QuanLyNhanVien"));
const QuanLyKhachHang = lazy(() => import("./pages/admin/QuanLyKhachHang"));
const LichSuQuyTac = lazy(() => import("./pages/admin/LichSuQuyTac"));
const LichSuHang = lazy(() => import("./pages/admin/LichSuHang"));
const LichSuDiem = lazy(() => import("./pages/admin/LichSuDiem"));
const QuanLyThongBao = lazy(() => import("./pages/admin/QuanLyThongBao"));
const QuanLyPhanHoi = lazy(() => import("./pages/admin/QuanLyPhanHoi"));
const ThongKe = lazy(() => import("./pages/admin/ThongKe"));
const QuanLyHoaDonAdmin = lazy(() => import("./pages/admin/QuanLyHoaDon"));
const CauHinhWebsite = lazy(() => import("./pages/admin/CauHinhWebsite"));

// ================= PROTECTED ROUTES =================
import {
    MemberRoute,
    StaffRoute,
    AdminRoute,
    GuestRoute,
} from "./routes/ProtectedRoute";
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));

const routeFallback = (
    <div role="status" aria-live="polite" style={{ padding: "2rem", textAlign: "center" }}>
        Đang tải trang…
    </div>
);

function MemberLegacyRedirect({ to }) {
    const location = useLocation();

    return <Navigate to={to} replace state={location.state} />;
}

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={routeFallback}>
                <Routes>

                {/* ---------------- PUBLIC ROUTES ---------------- */}
                <Route element={<PublicLayout />}>

                    <Route
                        path="/"
                        element={<Home />}
                    />

                    <Route path="*" element={<NotFound />} />

                </Route>

                <Route path="/login" element={<GuestRoute><LoginMember /></GuestRoute>} />
                <Route path="/member/login" element={<GuestRoute><LoginMember /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                <Route path="/staff/login" element={<GuestRoute><LoginStaff /></GuestRoute>} />
                <Route
                    path="/forgot-password"
                    element={<GuestRoute><ForgotPassword /></GuestRoute>}
                />

                <Route
                    path="/reset-password"
                    element={<GuestRoute><ResetPassword /></GuestRoute>}
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
                    <Route index element={<MemberLegacyRedirect to="/member/rank" />} />
                    <Route path="home" element={<MemberLegacyRedirect to="/member/rank" />} />
                    <Route path="rank" element={<MemberRank />} />
                    <Route
                        path="ticket"
                        element={<MemberLegacyRedirect to="/member/rank?tab=tickets" />}
                    />
                    <Route
                        path="voucher"
                        element={<MemberLegacyRedirect to="/member/rank?tab=vouchers" />}
                    />
                    <Route
                        path="invoice"
                        element={<MemberLegacyRedirect to="/member/rank?tab=transactions" />}
                    />
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
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
