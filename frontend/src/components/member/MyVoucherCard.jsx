function MyVoucherCard({ voucher }) {

    const uuDai = voucher.uu_dai || voucher.uuDai;

    const formatMoney = (money) => {

        return Number(money).toLocaleString("vi-VN");

    };

    const formatDate = (date) => {

        if (!date) return "--";

        return new Date(date).toLocaleDateString("vi-VN");

    };

    const getStatus = () => {

        if (voucher.TrangThai === "DaSuDung") {
            return {
                text: "Đã sử dụng",
                className: "used"
            };
        }

        if (voucher.TrangThai === "HetHan") {
            return {
                text: "Hết hạn",
                className: "expired"
            };
        }

        return {
            text: "Còn hiệu lực",
            className: "active"
        };
    };

    const status = getStatus();

    return (

        <div className="my-voucher-card">

            <div className="voucher-top">

                <h4>

                    {uuDai?.TenUuDai}

                </h4>

                <span className={`status ${status.className}`}>

                    {status.text}

                </span>

            </div>

            <div className="voucher-money">

                Giảm {formatMoney(uuDai?.GiaTriGiam)} đ

            </div>

            <div className="voucher-desc">

                {uuDai?.MoTa}

            </div>

            <div className="voucher-info">

                <div>

                    <strong>Ngày cấp</strong>

                    <br />

                    {formatDate(voucher.NgayCap)}

                </div>

                <div>

                    <strong>Hết hạn</strong>

                    <br />

                    {formatDate(voucher.NgayHetHan)}

                </div>

            </div>

        </div>

    );

}

export default MyVoucherCard;