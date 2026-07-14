import MyVoucherCard from "./MyVoucherCard";

function MyVoucherList({
    vouchers,
    links,
    onPageChange
}) {

    return (

        <div className="voucher-section">

            <div className="section-header">

                <h3>Voucher của tôi</h3>

                <span>{vouchers.length} voucher</span>

            </div>

            {
                vouchers.length === 0 ? (

                    <div className="empty-voucher">

                        Bạn chưa sở hữu voucher nào.

                    </div>

                ) : (

                    <>

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

                        {/* Phân trang */}

                        <div className="d-flex justify-content-center mt-4">

                            {

                                links.map((link, index) => (

                                    <button

                                        key={index}

                                        className={`btn btn-sm mx-1 ${
                                            link.active
                                                ? "btn-success"
                                                : "btn-outline-success"
                                        }`}

                                        disabled={!link.url}

                                        onClick={() => {

                                            if (link.url) {

                                                const page = new URL(link.url)
                                                    .searchParams
                                                    .get("page");

                                                onPageChange(Number(page));

                                            }

                                        }}

                                        dangerouslySetInnerHTML={{
                                            __html: link.label
                                        }}

                                    />

                                ))

                            }

                        </div>

                    </>

                )

            }

        </div>

    );

}

export default MyVoucherList;