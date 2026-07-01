// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import LoginMember    from "./pages/auth/LoginMember";
// import LoginStaff     from "./pages/auth/LoginStaff";
// import Home           from "./pages/Home";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import StaffDashboard from "./pages/staff/StaffDashboard";
// import MemberHome     from "./pages/member/MemberHome";
// import Register       from "./pages/auth/Register";
// import TaoHoaDon      from "./pages/staff/TaoHoaDon";
// import PrivateRoute   from "./routes/PrivateRoute";

// function App() {
//     return (
//         <BrowserRouter>
//             <Routes>
//                 <Route path="/"             element={<Home />} />
//                 <Route path="/login"        element={<LoginMember />} />
//                 <Route path="/staff/login"  element={<LoginStaff />} />
//                 <Route path="/register"     element={<Register />} />

//                 <Route
//                     path="/member/home"
//                     element={
//                         <PrivateRoute allowedRoles={["member"]}>
//                             <MemberHome />
//                         </PrivateRoute>
//                     }
//                 />
//                 {/* <Route
//                     path="/staff/dashboard"
//                     element={
//                         <PrivateRoute allowedRoles={["Admin", "NhanVien"]}>
//                             <StaffDashboard />
//                         </PrivateRoute>
//                     }
//                 />
//                 <Route
//                     path="/staff/tao-hoa-don"
//                     element={
//                         <PrivateRoute allowedRoles={["Admin", "NhanVien"]}>
//                             <TaoHoaDon />
//                         </PrivateRoute>
//                     }
//                 /> */}
//                 <Route
//                     path="/admin/dashboard"
//                     element={
//                         <PrivateRoute allowedRoles={["Admin"]}>
//                             <AdminDashboard />
//                         </PrivateRoute>
//                     }
//                 />

//             </Routes>
//         </BrowserRouter>
//     );
// }

// export default App;
// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

<<<<<<< HEAD
import Home from "./pages/Home";

import LoginMember from "./pages/auth/LoginMember";
import LoginStaff  from "./pages/auth/LoginStaff";
import Register    from "./pages/auth/Register";

=======
import LoginMember    from "./pages/auth/LoginMember";
import LoginStaff     from "./pages/auth/LoginStaff";
import Home           from "./pages/Home";
import Register       from "./pages/auth/Register";
import MemberHome     from "./pages/member/MemberHome";
>>>>>>> 6605e29e98dff2a474acf8ecbecbaca207846763
import AdminDashboard from "./pages/admin/AdminDashboard";

import StaffLayout    from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
<<<<<<< HEAD

import MemberLayout from "./layouts/MemberLayout";
import MemberHome   from "./pages/member/MemberHome";
import Profile      from "./pages/member/Profile";
import Points       from "./pages/member/Points";

import { MemberRoute, StaffRoute, AdminRoute } from "./routes/ProtectedRoute";
=======
import TaoHoaDon      from "./pages/staff/TaoHoaDon";

import PrivateRoute   from "./routes/PrivateRoute";
>>>>>>> 6605e29e98dff2a474acf8ecbecbaca207846763

function App() {
    return (
        <BrowserRouter>
            <Routes>

<<<<<<< HEAD
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

=======
                
                <Route path="/"            element={<Home />} />
                <Route path="/login"       element={<LoginMember />} />
                <Route path="/staff/login" element={<LoginStaff />} />
                <Route path="/register"    element={<Register />} />

                <Route
                    path="/member/home"
                    element={
                        <PrivateRoute allowedRoles={["member"]}>
                            <MemberHome />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/dashboard"
                    element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                            <AdminDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    element={
                        <PrivateRoute allowedRoles={["Admin", "NhanVien"]}>
                            <StaffLayout />
                        </PrivateRoute>
                    }
                >
                    <Route path="/staff/dashboard"    element={<StaffDashboard />} />
                    <Route path="/staff/tao-hoa-don"  element={<TaoHoaDon />} />
                    <Route path="/staff/quan-ly-hoa-don" element={<div style={{padding:32}}><h2>Quản lý hóa đơn</h2></div>} />
                </Route>
>>>>>>> 6605e29e98dff2a474acf8ecbecbaca207846763
            </Routes>
        </BrowserRouter>
    );
}

export default App;