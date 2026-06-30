import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "../assets/css/memberLayout.css";

function MemberLayout() {

    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {

        Swal.fire({

            title: "Đăng xuất?",
            text: "Bạn muốn đăng xuất khỏi hệ thống?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đăng xuất",
            cancelButtonText: "Hủy"

        }).then(result => {

            if (result.isConfirmed) {

                localStorage.clear();

                navigate("/");

            }

        });

    }

    return (

        <>

            {/* HEADER */}

            <header className="member-header">

                <div className="container member-header-content">

                    <div className="member-logo">

                        🍽️ BUFFET VIP

                    </div>

                    <div className="member-user">

                        <div>

                            <small>Xin chào</small>

                            <h6>{user?.HoTen}</h6>

                        </div>

                        <Link
                            to="/member/profile"
                            className="btn btn-light btn-sm"
                        >

                            Hồ sơ

                        </Link>

                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleLogout}
                        >

                            Đăng xuất

                        </button>

                    </div>

                </div>

            </header>


            {/* MENU */}

            <div className="member-menu">

                <div className="container">

                    <Link
                        className={location.pathname==="/member/home"?"active":""}
                        to="/member/home"
                    >

                        Trang chủ

                    </Link>

                    <Link
                        className={location.pathname==="/member/points"?"active":""}
                        to="/member/points"
                    >

                        Tích điểm

                    </Link>

                    <Link
                        to="/member/rank"
                    >

                        Hạng thành viên

                    </Link>

                    <Link
                        to="/member/voucher"
                    >

                        Kho Voucher

                    </Link>

                    <Link
                        to="/member/ticket"
                    >

                        Vé Buffet

                    </Link>

                    <Link
                        to="/member/invoice"
                    >

                        Lịch sử hóa đơn

                    </Link>

                    <Link
                        className={location.pathname==="/member/profile"?"active":""}
                        to="/member/profile"
                    >

                        Thông tin cá nhân

                    </Link>

                </div>

            </div>


            {/* CONTENT */}

            <main className="member-content">

                <Outlet/>

            </main>


            {/* FOOTER */}

            <footer className="member-footer">

                <div className="container">

                    <div className="row">

                        <div className="col-md-4">

                            <h4>BUFFET VIP</h4>

                            <p>

                                Hệ thống khách hàng thân thiết dành cho Buffet VIP.

                            </p>

                        </div>

                        <div className="col-md-4">

                            <h5>Liên hệ</h5>

                            <p>📍 TP.HCM</p>

                            <p>☎ 1900 9999</p>

                            <p>✉ buffetvip@gmail.com</p>

                        </div>

                        <div className="col-md-4">

                            <h5>Kết nối</h5>

                            <div className="social">

                                <i className="bi bi-facebook"></i>

                                <i className="bi bi-tiktok"></i>

                                <i className="bi bi-instagram"></i>

                            </div>

                            <div className="map">

                                Google Map

                            </div>

                        </div>

                    </div>

                </div>

            </footer>

        </>

    );

}

export default MemberLayout;