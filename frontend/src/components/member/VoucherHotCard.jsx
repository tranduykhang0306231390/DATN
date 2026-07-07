import { Link } from "react-router-dom";
import "../../assets/css/voucherhotcard.css";
function VoucherHotCard({ voucher }) {

    return (

        <div className="voucher-hot-card">

            <div className="voucher-hot-top">

                <span className="badge bg-danger">

                    Giảm {Number(voucher.GiaTriGiam).toLocaleString("vi-VN")}đ

                </span>

            </div>

            <h5 className="mt-3">

                {voucher.TenUuDai}

            </h5>

            <p className="text-muted">

                {voucher.MoTa}

            </p>

            <div className="voucher-hot-point">

                 {Number(voucher.SoDiemCanDoi).toLocaleString("vi-VN")} điểm

            </div>

            <Link
                to="/member/voucher"
                className="btn btn-success w-100 mt-3"
            >
                Đổi ngay
            </Link>

        </div>

    );

}

export default VoucherHotCard;