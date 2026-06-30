import { useEffect, useState } from "react";
import { getMemberPoints } from "../../api/authApi";
import "../../assets/css/points.css";
import Swal from "sweetalert2";
import PointHistory from "../../components/member/PointHistory";
function Points() {

    const [points, setPoints] = useState(null);

    useEffect(() => {

        loadData();

    }, []);

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

    }

    const loadData = async () => {

        try {

            const response = await getMemberPoints();

            setPoints(response.data);

        } catch (error) {

            console.log(error);

            Swal.fire({
                icon: "error",
                title: "Không lấy được điểm tích lũy"
            });

        }

    }

    if (!points)
        return <h3 className="mt-5 text-center">Đang tải...</h3>;

    return (

        <div className="container py-4">

            <h2 className="mb-4 fw-bold">

                ⭐ Điểm của tôi

            </h2>

            <div className="row g-4">

                <div className="col-md-4">

                    <div className="point-card">

                        <h6>Điểm hiện tại</h6>

                        <h1>{points.TongDiem}</h1>

                    </div>

                </div>

                <div className="col-md-4">

                    <div className="point-card">

                        <h6>Hạng thành viên</h6>

                        <h2>

                            {getRankName(points.HangThanhVien)}

                        </h2>

                    </div>

                </div>

                <div className="col-md-4">

                    <div className="point-card">

                        <h6>Tổng hóa đơn</h6>

                        <h2>{points.TongHoaDon}</h2>

                    </div>

                </div>

            </div>

            <div className="row mt-4 g-4">

                <div className="col-md-4">

                    <div className="point-card">

                        <h6>Tổng chi tiêu</h6>

                        <h2>

                            {Number(points.TongChiTieu).toLocaleString()} đ

                        </h2>

                    </div>

                </div>

                <div className="col-md-4">

                    <div className="point-card">

                        <h6>Điểm đã nhận</h6>

                        <h2>{points.TongDiemNhan}</h2>

                    </div>

                </div>

                <div className="col-md-4">

                    <div className="point-card">

                        <h6>Điểm đã sử dụng</h6>

                        <h2>{points.TongDiemDaDung}</h2>

                    </div>

                </div>

            </div>
            <PointHistory />
        </div>

    );
}

export default Points;