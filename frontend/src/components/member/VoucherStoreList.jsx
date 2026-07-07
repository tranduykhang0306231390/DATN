import VoucherStoreCard from "./VoucherStoreCard";

function VoucherStoreList({ vouchers, reloadData }) {

    return (

        <div className="voucher-section">

            <div className="section-header">

                <h3>Kho Voucher</h3>

                <span>{vouchers.length} voucher</span>

            </div>

            {
                vouchers.length === 0 ? (

                    <div className="empty-voucher">

                        Hiện tại chưa có voucher nào.

                    </div>

                ) : (

                    <div className="voucher-grid">

                        {
                            vouchers.map((voucher) => (

                                <VoucherStoreCard
                                    key={voucher.MaUuDai}
                                    voucher={voucher}
                                    reloadData={reloadData}
                                />

                            ))
                        }

                    </div>

                )
            }

        </div>

    );

}

export default VoucherStoreList;