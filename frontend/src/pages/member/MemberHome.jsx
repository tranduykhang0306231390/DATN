import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/css/memberHome.css";

function MemberHome() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    useEffect(() => {

        const data = JSON.parse(localStorage.getItem("user"));

        if (!data) {
            navigate("/login");
            return;
        }

        setUser(data);

    }, []);

    if (!user) return null;

    const getRankName = (rank) => {

        switch (rank) {

            case "HTV001":
                return "🥉 Đồng";

            case "HTV002":
                return "🥈 Bạc";

            case "HTV003":
                return "🥇 Vàng";

            case "HTV004":
                return "💎 Kim cương";

            default:
                return rank;
        }

    };

    return (

        <>

            <div className="welcome-card">

                <h2>
                    🎉 Chào mừng quay trở lại, {user.HoTen}
                </h2>

                <p>
                    Chúc bạn có những bữa tiệc buffet tuyệt vời tại
                    <strong> Buffet VIP</strong>
                </p>

            </div>

            <div className="row mt-4 g-4">

                <div className="col-lg-3 col-md-6">

                    <div className="dashboard-card">

                        <i className="bi bi-award-fill dashboard-icon"></i>

                        <h5>Hạng thành viên</h5>

                        <h4 className="text-warning">
                            {getRankName(user.MaHangThanhVien)}
                        </h4>

                    </div>

                </div>

                <div className="col-lg-3 col-md-6">

                    <div className="dashboard-card">

                        <i className="bi bi-star-fill dashboard-icon"></i>

                        <h5>Tổng điểm</h5>

                        <h3>
                            {user.TongDiem}
                        </h3>

                    </div>

                </div>

                <div className="col-lg-3 col-md-6">

                    <div className="dashboard-card">

                        <i className="bi bi-ticket-perforated-fill dashboard-icon"></i>

                        <h5>Voucher</h5>

                        <p>
                            Xem voucher hiện có
                        </p>

                        <Link
                            to="/member/voucher"
                            className="btn btn-dark"
                        >
                            Xem
                        </Link>

                    </div>

                </div>

                <div className="col-lg-3 col-md-6">

                    <div className="dashboard-card">

                        <i className="bi bi-person-circle dashboard-icon"></i>

                        <h5>Thông tin cá nhân</h5>

                        <p>
                            Quản lý tài khoản
                        </p>

                        <Link
                            to="/member/profile"
                            className="btn btn-dark"
                        >
                            Xem
                        </Link>

                    </div>

                </div>

            </div>

            <div className="row mt-4 g-4">

                <div className="col-lg-4">

                    <div className="dashboard-card">

                        <i className="bi bi-receipt dashboard-icon"></i>

                        <h5>Lịch sử hóa đơn</h5>

                        <p>
                            Theo dõi các lần dùng bữa.
                        </p>

                        <Link
                            to="/member/history"
                            className="btn btn-outline-dark"
                        >
                            Xem
                        </Link>

                    </div>

                </div>

                <div className="col-lg-4">

                    <div className="dashboard-card">

                        <i className="bi bi-chat-dots-fill dashboard-icon"></i>

                        <h5>Gửi phản hồi</h5>

                        <p>
                            Đóng góp ý kiến để phục vụ tốt hơn.
                        </p>

                        <Link
                            to="/member/feedback"
                            className="btn btn-outline-dark"
                        >
                            Gửi ngay
                        </Link>

                    </div>

                </div>

                <div className="col-lg-4">

                    <div className="dashboard-card">

                        <i className="bi bi-gift-fill dashboard-icon"></i>

                        <h5>Ưu đãi hôm nay</h5>

                        <p>
                            Khám phá các ưu đãi dành riêng cho bạn.
                        </p>

                        <button
                            className="btn btn-outline-dark"
                        >
                            Xem ưu đãi
                        </button>

                    </div>

                </div>

            </div>

        </>

    );

}

export default MemberHome;