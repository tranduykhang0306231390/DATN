import {
    lazy,
    Suspense,
} from "react";

import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/

import {
    AdminRoute,
    GuestRoute,
    MemberRoute,
    StaffRoute,
} from "./routes/ProtectedRoute";

/*
|--------------------------------------------------------------------------
| Public pages
|--------------------------------------------------------------------------
*/

const PublicLayout = lazy(
    () => import("./layouts/PublicLayout")
);

const Home = lazy(
    () => import("./pages/Home")
);

const LoginMember = lazy(
    () => import("./pages/auth/LoginMember")
);

const LoginStaff = lazy(
    () => import("./pages/auth/LoginStaff")
);

const Register = lazy(
    () => import("./pages/auth/Register")
);

const ForgotPassword = lazy(
    () => import("./pages/auth/ForgotPassword")
);

const ResetPassword = lazy(
    () => import("./pages/auth/ResetPassword")
);

const NotFound = lazy(
    () => import("./pages/NotFound")
);

/*
|--------------------------------------------------------------------------
| Member
|--------------------------------------------------------------------------
*/

const MemberLayout = lazy(
    () => import("./layouts/MemberLayout")
);

const MemberRank = lazy(
    () => import("./pages/member/MemberRank")
);

/*
|--------------------------------------------------------------------------
| Staff
|--------------------------------------------------------------------------
*/

const StaffLayout = lazy(
    () => import("./layouts/StaffLayout")
);

const StaffDashboard = lazy(
    () => import("./pages/staff/StaffDashboard")
);

const TaoHoaDon = lazy(
    () => import("./pages/staff/TaoHoaDon")
);

const QuanLyHoaDon = lazy(
    () => import("./pages/staff/QuanLyHoaDon")
);

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

const AdminLayout = lazy(
    () => import("./layouts/AdminLayout")
);

const AdminDashboard = lazy(
    () => import("./pages/admin/AdminDashboard")
);

const QuanLyUuDai = lazy(
    () => import("./pages/admin/QuanLyUuDai")
);

const QuanLyLoaiVe = lazy(
    () => import("./pages/admin/QuanLyLoaiVe")
);

const QuanLyQuyTac = lazy(
    () => import("./pages/admin/QuanLyQuyTac")
);

const QuanLyHangThanhVien = lazy(
    () => import("./pages/admin/QuanLyHangThanhVien")
);

const QuanLyNhanVien = lazy(
    () => import("./pages/admin/QuanLyNhanVien")
);

const QuanLyKhachHang = lazy(
    () => import("./pages/admin/QuanLyKhachHang")
);

const LichSuQuyTac = lazy(
    () => import("./pages/admin/LichSuQuyTac")
);

const LichSuHang = lazy(
    () => import("./pages/admin/LichSuHang")
);

const LichSuDiem = lazy(
    () => import("./pages/admin/LichSuDiem")
);

const QuanLyThongBao = lazy(
    () => import("./pages/admin/QuanLyThongBao")
);

const QuanLyPhanHoi = lazy(
    () => import("./pages/admin/QuanLyPhanHoi")
);

const ThongKe = lazy(
    () => import("./pages/admin/ThongKe")
);

const QuanLyHoaDonAdmin = lazy(
    () => import("./pages/admin/QuanLyHoaDon")
);

const CauHinhWebsite = lazy(
    () => import("./pages/admin/CauHinhWebsite")
);

/*
|--------------------------------------------------------------------------
| Loading fallback
|--------------------------------------------------------------------------
*/

const routeFallback = (
    <div
        role="status"
        aria-live="polite"
        style={{
            padding: "2rem",
            textAlign: "center",
        }}
    >
        Đang tải trang…
    </div>
);

/*
|--------------------------------------------------------------------------
| Redirect các đường dẫn Member cũ
|--------------------------------------------------------------------------
*/

function MemberLegacyRedirect({ to }) {
    const location = useLocation();

    return (
        <Navigate
            to={to}
            replace
            state={location.state}
        />
    );
}

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={routeFallback}>
                <Routes>
                    {/*
                    |--------------------------------------------------------------------------
                    | Public routes
                    |--------------------------------------------------------------------------
                    */}

                    <Route element={<PublicLayout />}>
                        <Route
                            index
                            element={<Home />}
                        />
                    </Route>

                    {/*
                    |--------------------------------------------------------------------------
                    | Authentication routes
                    |--------------------------------------------------------------------------
                    */}

                    <Route
                        path="/login"
                        element={
                            <GuestRoute>
                                <LoginMember />
                            </GuestRoute>
                        }
                    />

                    <Route
                        path="/member/login"
                        element={
                            <GuestRoute>
                                <LoginMember />
                            </GuestRoute>
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            <GuestRoute>
                                <Register />
                            </GuestRoute>
                        }
                    />

                    <Route
                        path="/forgot-password"
                        element={
                            <GuestRoute>
                                <ForgotPassword />
                            </GuestRoute>
                        }
                    />

                    <Route
                        path="/reset-password"
                        element={
                            <GuestRoute>
                                <ResetPassword />
                            </GuestRoute>
                        }
                    />

                    <Route
                        path="/staff/login"
                        element={
                            <GuestRoute>
                                <LoginStaff />
                            </GuestRoute>
                        }
                    />

                    {/*
                    |--------------------------------------------------------------------------
                    | Member routes
                    |--------------------------------------------------------------------------
                    */}

                    <Route
                        path="/member"
                        element={
                            <MemberRoute>
                                <MemberLayout />
                            </MemberRoute>
                        }
                    >
                        <Route
                            index
                            element={
                                <MemberLegacyRedirect
                                    to="/member/rank"
                                />
                            }
                        />

                        <Route
                            path="home"
                            element={
                                <MemberLegacyRedirect
                                    to="/member/rank"
                                />
                            }
                        />

                        <Route
                            path="rank"
                            element={<MemberRank />}
                        />

                        <Route
                            path="ticket"
                            element={
                                <MemberLegacyRedirect
                                    to="/member/rank?tab=tickets"
                                />
                            }
                        />

                        <Route
                            path="voucher"
                            element={
                                <MemberLegacyRedirect
                                    to="/member/rank?tab=vouchers"
                                />
                            }
                        />

                        <Route
                            path="invoice"
                            element={
                                <MemberLegacyRedirect
                                    to="/member/rank?tab=transactions"
                                />
                            }
                        />
                    </Route>

                    {/*
                    |--------------------------------------------------------------------------
                    | Staff routes
                    |--------------------------------------------------------------------------
                    */}

                    <Route
                        path="/staff"
                        element={
                            <StaffRoute>
                                <StaffLayout />
                            </StaffRoute>
                        }
                    >
                        <Route
                            index
                            element={
                                <Navigate
                                    to="dashboard"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="dashboard"
                            element={<StaffDashboard />}
                        />

                        <Route
                            path="tao-hoa-don"
                            element={<TaoHoaDon />}
                        />

                        <Route
                            path="quan-ly-hoa-don"
                            element={<QuanLyHoaDon />}
                        />
                    </Route>

                    {/*
                    |--------------------------------------------------------------------------
                    | Admin routes
                    |--------------------------------------------------------------------------
                    |
                    | AdminRoute chỉ cần bọc AdminLayout một lần.
                    | Toàn bộ route con đều được bảo vệ thông qua layout cha.
                    |
                    */}

                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminLayout />
                            </AdminRoute>
                        }
                    >
                        <Route
                            index
                            element={
                                <Navigate
                                    to="dashboard"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="dashboard"
                            element={<AdminDashboard />}
                        />

                        <Route
                            path="uu-dai"
                            element={<QuanLyUuDai />}
                        />

                        <Route
                            path="loai-ve"
                            element={<QuanLyLoaiVe />}
                        />

                        <Route
                            path="quy-tac"
                            element={<QuanLyQuyTac />}
                        />

                        <Route
                            path="hang-thanh-vien"
                            element={
                                <QuanLyHangThanhVien />
                            }
                        />

                        <Route
                            path="nhan-vien"
                            element={<QuanLyNhanVien />}
                        />

                        <Route
                            path="khach-hang"
                            element={<QuanLyKhachHang />}
                        />

                        <Route
                            path="lich-su-quy-tac"
                            element={<LichSuQuyTac />}
                        />

                        <Route
                            path="lich-su-hang"
                            element={<LichSuHang />}
                        />

                        <Route
                            path="lich-su-diem"
                            element={<LichSuDiem />}
                        />

                        <Route
                            path="thong-bao"
                            element={<QuanLyThongBao />}
                        />

                        <Route
                            path="phan-hoi"
                            element={<QuanLyPhanHoi />}
                        />

                        <Route
                            path="thong-ke"
                            element={<ThongKe />}
                        />

                        <Route
                            path="quan-ly-hoa-don"
                            element={<QuanLyHoaDonAdmin />}
                        />

                        <Route
                            path="cau-hinh-website"
                            element={<CauHinhWebsite />}
                        />
                    </Route>

                    {/*
                    |--------------------------------------------------------------------------
                    | Not found
                    |--------------------------------------------------------------------------
                    */}

                    <Route
                        path="*"
                        element={<NotFound />}
                    />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;