import VoucherStoreCard from "./VoucherStoreCard";

function VoucherStoreList({ vouchers, links, onPageChange, reloadData }) {

    const getLabel = (label) => {
        if (label.includes("Previous")) return "«";
        if (label.includes("Next")) return "»";
        return label;
    };

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

                    <>
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

                    <div className="voucher-pagination">
                        {links.map((link, index) => (
                            <button
                                key={index}
                                className={`page-btn ${link.active ? "active" : ""} ${!link.url ? "disabled" : ""}`}
                                disabled={!link.url}
                                onClick={() => {
                                    if (link.url) {
                                        const page = new URL(link.url).searchParams.get("page");
                                        onPageChange(Number(page));
                                    }
                                }}
                            >
                                {getLabel(link.label)}
                            </button>
                        ))}
                    </div>
                    </>

                )
            }

        </div>

    );

}

export default VoucherStoreList;
