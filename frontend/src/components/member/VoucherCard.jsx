function VoucherCard({ voucher }) {

    return (
        <div className="voucher-card">

            <img
                src={`http://127.0.0.1:8000/storage/${voucher.HinhAnh}`}
                alt=""
            />

            <h5>{voucher.TenUuDai}</h5>

            <p>{voucher.MoTa}</p>

            <div className="voucher-footer">

                <span>
                    {Number(voucher.GiaTriGiam).toLocaleString()} đ
                </span>

                <button className="btn btn-success btn-sm">
                    Đổi
                </button>

            </div>

        </div>
    );
}

export default VoucherCard;