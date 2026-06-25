import { Link } from "react-router-dom";
import "../assets/css/home.css";

function Home() {
    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
                <div className="container">

                    <a className="navbar-brand fw-bold">
                        BUFFET VIP
                    </a>

                    <div className="ms-auto">

                        <Link
                            to="/login"
                            className="btn btn-outline-light me-2"
                        >
                            Đăng nhập
                        </Link>

                        <Link
                            to="/register"
                            className="btn btn-warning"
                        >
                            Đăng ký
                        </Link>

                    </div>

                </div>
            </nav>

            <section className="hero-section">

                <div className="hero-overlay">

                    <h1>
                        Thưởng thức Buffet - Nhận ngàn ưu đãi
                    </h1>

                    <p>
                        Tích điểm mỗi lần dùng bữa,
                        đổi voucher hấp dẫn và nâng hạng thành viên VIP.
                    </p>

                    <Link
                        to="/register"
                        className="btn btn-warning btn-lg"
                    >
                        Tham gia ngay
                    </Link>

                </div>

            </section>

            <section className="container py-5">

                <h2 className="text-center mb-5">
                    Quyền lợi thành viên
                </h2>

                <div className="row">

                    <div className="col-md-4">
                        <div className="feature-card">
                            <h4>🎁 Tích điểm</h4>
                            <p>Mỗi hóa đơn đều được cộng điểm.</p>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="feature-card">
                            <h4>🎟 Voucher</h4>
                            <p>Đổi điểm lấy ưu đãi buffet.</p>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="feature-card">
                            <h4>👑 Thành viên VIP</h4>
                            <p>Nâng hạng để nhận nhiều đặc quyền.</p>
                        </div>
                    </div>

                </div>

            </section>

            <section className="tier-section">

                <div className="container">

                    <h2 className="text-center mb-5">
                        Hạng thành viên
                    </h2>

                    <div className="row">

                        <div className="col-md-3">
                            <div className="tier-card">
                                🥉 Silver
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="tier-card">
                                🥈 Gold
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="tier-card">
                                🥇 Platinum
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="tier-card">
                                💎 Diamond
                            </div>
                        </div>

                    </div>

                </div>

            </section>

            <footer className="footer">

                <h5>BUFFET VIP</h5>

                <p>
                    Hệ thống chăm sóc khách hàng thân thiết
                </p>

            </footer>
        </>
    );
}

export default Home;