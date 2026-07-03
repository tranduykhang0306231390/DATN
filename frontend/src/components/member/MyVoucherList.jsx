import MyVoucherCard from "./MyVoucherCard";

function MyVoucherList({ vouchers }) {

    return (
        <div className="voucher-section">

            <div className="section-header">
                <h3>🎁 Voucher của tôi</h3>
                <span>{vouchers.length} voucher</span>
            </div>

            {
                vouchers.length === 0 ? (

                    <div className="empty-voucher">

                        Bạn chưa sở hữu voucher nào.

                    </div>

                ) : (

                    <div className="voucher-grid">

                        {
                            vouchers.map((voucher) => (

                                <MyVoucherCard
                                    key={voucher.MaVoucherKhachHang}
                                    voucher={voucher}
                                />

                            ))
                        }

                    </div>

                )
            }

        </div>
    );

}

export default MyVoucherList;