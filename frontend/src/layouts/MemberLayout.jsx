import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "../assets/css/memberLayout.css";
import Footer from "../components/public/Footer";
import NotificationBell from "../components/member/NotificationBell";
function MemberLayout() {

    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {

        Swal.fire({

            title: "Đăng xuất",
            text: "Bạn có muốn đăng xuất không?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đăng xuất",
            cancelButtonText: "Hủy"

        }).then((result) => {

            if (result.isConfirmed) {

                localStorage.clear();
                navigate("/");

            }

        });

    };

    return (

        <>

            {/* HEADER */}

            <header className="member-header">

                <div className="container member-header-content">

                    <div className="member-logo">

                        BUFFET VIP

                    </div>

                    <div className="member-user">

                        <NotificationBell />

                        <span>
                            Xin chào, <strong>{user?.HoTen}</strong>
                        </span>

                        <button
                            className="btn btn-outline-light btn-sm ms-3"
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </button>

                    </div>

                </div>

            </header>

            {/* MENU */}

            <nav className="member-menu">

                <div className="container">

                    <Link
                        to="/member/home"
                        className={location.pathname === "/member/home" ? "active" : ""}
                    >
                        Trang chủ
                    </Link>

                    <Link
                        to="/member/ticket"
                        className={location.pathname === "/member/ticket" ? "active" : ""}
                    >
                        Tham khảo vé
                    </Link>

                    <Link
                        to="/member/rank"
                        className={location.pathname === "/member/rank" ? "active" : ""}
                    >
                        Hạng thành viên
                    </Link>

                    <Link
                        to="/member/voucher"
                        className={location.pathname === "/member/voucher" ? "active" : ""}
                    >
                        Kho Voucher
                    </Link>

                    <Link
                        to="/member/invoice"
                        className={location.pathname === "/member/invoice" ? "active" : ""}
                    >
                        Lịch sử giao dịch
                    </Link>

                </div>

            </nav>

            {/* CONTENT */}

            <main className="member-content">

                <Outlet />

            </main>

            <Footer />

        </>

    );

}

export default MemberLayout;