import Pagination from "../customer/ui/Pagination";
import MyVoucherCard from "./MyVoucherCard";
import VoucherGrid from "./VoucherGrid";

function MyVoucherList({
    vouchers,
    page,
    totalPages,
    loading,
    error,
    onPageChange,
    onRetry,
}) {
    return (
        <section
            id="voucher-panel-mine"
            className="reward-voucher-panel"
            role="tabpanel"
            aria-labelledby="voucher-tab-mine"
        >
            <div className="reward-voucher-panel__intro">
                <div>
                    <span>Ví phần thưởng</span>
                    <h2>Voucher của tôi</h2>
                    <p>Voucher đã dùng và hết hạn vẫn được giữ lại để bạn dễ theo dõi.</p>
                </div>
            </div>

            <VoucherGrid
                items={vouchers}
                loading={loading}
                error={error}
                onRetry={onRetry}
                emptyTitle="Bạn chưa sở hữu voucher nào"
                emptyDescription="Đổi một phần thưởng trong kho để voucher xuất hiện tại đây."
            >
                {vouchers.map((voucher) => (
                    <MyVoucherCard
                        key={voucher.MaVoucherKhachHang}
                        voucher={voucher}
                    />
                ))}
            </VoucherGrid>

            {vouchers.length > 0 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    disabled={loading}
                    ariaLabel="Phân trang voucher của tôi"
                />
            )}
        </section>
    );
}

export default MyVoucherList;
