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

        <section className="hero-section">

            <div className="hero-overlay">

                <h1>
                    Buffet VIP
                </h1>

                <p>
                    Trải nghiệm ẩm thực đẳng cấp cùng chương trình
                    khách hàng thân thiết.
                </p>

            </div>

        </section>

        <div className="container">

            <div className="welcome-box">

                <h2>
                    Chào mừng {user.HoTen}
                </h2>

                <p>
                    Hạng hiện tại:
                    <strong>
                        {" "}
                        {getRankName(user.MaHangThanhVien)}
                    </strong>
                </p>

            </div>

            <div className="row mt-4">

                <div className="col-md-6">

                    <div className="promo-slider">

                        <h3>🔥 Vé Hot</h3>

                        <div className="promo-card">

                            Buffet Hải Sản Premium

                        </div>

                        <div className="promo-card">

                            Buffet BBQ Hàn Quốc

                        </div>

                        <div className="promo-card">

                            Buffet Lẩu Nhật Bản

                        </div>

                    </div>

                </div>

                <div className="col-md-6">

                    <div className="promo-slider">

                        <h3>🎁 Voucher Hot</h3>

                        <div className="promo-card">

                            Giảm 50.000 VNĐ

                        </div>

                        <div className="promo-card">

                            Tặng nước miễn phí

                        </div>

                        <div className="promo-card">

                            Giảm 10%

                        </div>

                    </div>

                </div>

            </div>

            <section className="story-section">

                <h2>Câu chuyện Buffet VIP</h2>

                <p>

                    Buffet VIP được xây dựng với mong muốn mang
                    đến trải nghiệm ẩm thực cao cấp, đa dạng
                    và chất lượng cho mọi khách hàng.

                </p>

                <p>

                    Chúng tôi luôn đặt sự hài lòng của khách hàng
                    lên hàng đầu và không ngừng cải tiến dịch vụ.

                </p>

            </section>

        </div>

    </>
);

}

export default MemberHome;