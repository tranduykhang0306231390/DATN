import { Outlet, Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../assets/css/memberLayout.css";

function MemberLayout() {

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {

        Swal.fire({
            title: "Đăng xuất?",
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

    };

    return (

        <>
            <header className="member-header">

                <div className="logo">

                    BUFFET VIP

                </div>

                <nav>

                    <Link to="/member/home">
                        Trang chủ
                    </Link>

                    <Link to="/member/profile">
                        Hồ sơ
                    </Link>

                    <Link to="/member/voucher">
                        Voucher
                    </Link>

                    <Link to="/member/history">
                        Tích điểm
                    </Link>
                    <Link
                        to="/member/points"
                        className="btn btn-warning"
                    >

                        Điểm của tôi

                    </Link>

                </nav>

                <div className="right">

                    Xin chào <b>{user?.HoTen}</b>

                    <button
                        className="btn btn-danger ms-3"
                        onClick={handleLogout}
                    >
                        Đăng xuất
                    </button>

                </div>

            </header>

            <main className="container py-4">

                <Outlet />

            </main>

            <footer className="member-footer">

                © 2026 Buffet VIP Loyalty

            </footer>

        </>

    );

}

export default MemberLayout;