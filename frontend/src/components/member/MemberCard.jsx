import "../../assets/css/memberRank.css";

function MemberCard({ user, points }) {

    const getRankName = (rank) => {

        switch (rank) {

            case "HTV001":
                return "ĐỒNG";

            case "HTV002":
                return "BẠC";

            case "HTV003":
                return "VÀNG";

            case "HTV004":
                return "KIM CƯƠNG";

            default:
                return "THÀNH VIÊN";
        }

    };

    if (!user || !points) return null;

    return (

        <div className="member-card">

            <div className="member-card-overlay">

                <div className="member-card-header">

                    <div>

                        <h4>BUFFET VIP</h4>

                        <span>MEMBERSHIP CARD</span>

                    </div>

                </div>

                <div className="member-card-body">

                    <h2>

                        {user.HoTen}

                    </h2>

                    <p>

                        Mã khách hàng: {user.MaKhachHang}

                    </p>

                </div>

                <div className="member-card-footer">

                    <div>

                        <small>HẠNG THÀNH VIÊN</small>

                        <h5>

                            {getRankName(points.HangThanhVien)}

                        </h5>

                    </div>

                    <div>

                        <small>ĐIỂM HIỆN TẠI</small>

                        <h5>

                            {points.TongDiem.toLocaleString()}

                        </h5>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default MemberCard;