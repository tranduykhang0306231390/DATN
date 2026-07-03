import Swal from "sweetalert2";
import { exchangeVoucher } from "../../api/authApi";

function VoucherStoreCard({ voucher, reloadData }) {

    const formatMoney = (money) => {
        return Number(money).toLocaleString("vi-VN");
    };

    const handleExchange = async () => {

        const result = await Swal.fire({
            title: "Đổi voucher?",
            text: `Bạn muốn đổi "${voucher.TenUuDai}"?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đổi ngay",
            cancelButtonText: "Hủy"
        });

        if (!result.isConfirmed) return;

        try {

            const res = await exchangeVoucher(voucher.MaUuDai);

            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: res.data.message
            });

            reloadData();

        } catch (err) {

            Swal.fire({
                icon: "error",
                title: "Không thể đổi",
                text:
                    err.response?.data?.message ||
                    "Có lỗi xảy ra."
            });

        }

    };

    return (

        <div className="store-voucher-card">

            <div className="voucher-header">

                <h4>

                    {voucher.TenUuDai}

                </h4>

                <div className="discount">

                    Giảm {formatMoney(voucher.GiaTriGiam)}đ

                </div>

            </div>

            <div className="voucher-description">

                {voucher.MoTa}

            </div>

            <div className="voucher-detail">

                <div>

                    ⭐ {voucher.SoDiemCanDoi} điểm

                </div>

                <div>

                    🎫 Còn {voucher.SoLuongTon}

                </div>

            </div>

            <button
                className="btn btn-success exchange-btn"
                onClick={handleExchange}
            >

                Đổi ngay

            </button>

        </div>

    );

}

export default VoucherStoreCard;