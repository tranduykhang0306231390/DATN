import "../../assets/css/memberRank.css";

function MemberPointSummary({ points }) {

    if (!points) return null;

    const getRankName = (rank) => {

        switch (rank) {

            case "HTV001":
                return "Đồng";

            case "HTV002":
                return "Bạc";

            case "HTV003":
                return "Vàng";

            case "HTV004":
                return "Kim Cương";

            default:
                return "Thành viên";
        }

    };

    const cards = [

     

        {
            title: "Tổng hóa đơn",
            value: points.TongHoaDon.toLocaleString()
        },

        {
            title: "Tổng chi tiêu",
            value: Number(points.TongChiTieu).toLocaleString() + " đ"
        },

        {
            title: "Điểm đã nhận",
            value: points.TongDiemNhan.toLocaleString()
        },

        
        {
            title: "Hạng thành viên",
            value: getRankName(points.HangThanhVien)
        }

    ];

    return (

        <div className="summary-section">

            <h3 className="section-title">

                Thống kê thành viên

            </h3>

            <div className="summary-grid">

                {

                    cards.map((item, index) => (

                        <div
                            className="summary-card"
                            key={index}
                        >

                            <span>

                                {item.title}

                            </span>

                            <h4>

                                {item.value}

                            </h4>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default MemberPointSummary;