import { FaExclamationCircle } from "react-icons/fa";
import Pagination from "../customer/ui/Pagination";
import VoucherGrid from "./VoucherGrid";
import VoucherStoreCard from "./VoucherStoreCard";
import { getStoreVoucherStatus } from "../../utils/voucher";

function VoucherStoreList({
    vouchers,
    points,
    page,
    totalPages,
    loading,
    error,
    submittingVoucherId,
    onRedeem,
    onPageChange,
    onRetry,
}) {
    const hasRedeemableVoucher = vouchers.some((voucher) => (
        getStoreVoucherStatus({
            voucher,
            currentPoints: points?.TongDiem,
            memberRankCode: points?.HangThanhVien,
        }).canRedeem
    ));

    return (
        <section
            id="voucher-panel-store"
            className="reward-voucher-panel"
            role="tabpanel"
            aria-labelledby="voucher-tab-store"
        >
            <div className="reward-voucher-panel__intro">
                <div>
                    <h2>Chọn phần thưởng dành cho bạn</h2>
                </div>
            </div>

            {!loading && vouchers.length > 0 && points && !hasRedeemableVoucher && (
                <div className="reward-voucher-points-notice" role="status">
                    <FaExclamationCircle aria-hidden="true" />
                    <span>Một vài voucher vừa hết hiệu lực. Vui lòng tải lại trang.</span>
                </div>
            )}

            <VoucherGrid
                items={vouchers}
                loading={loading}
                error={error}
                onRetry={onRetry}
                emptyTitle="Chưa có voucher nào bạn có thể đổi"
                emptyDescription="Kho chỉ hiển thị voucher bạn đủ điểm và đủ điều kiện đổi ngay. Tích thêm điểm để mở khóa các ưu đãi khác."
            >
                {vouchers.map((voucher) => (
                    <VoucherStoreCard
                        key={voucher.MaUuDai}
                        voucher={voucher}
                        points={points}
                        submittingVoucherId={submittingVoucherId}
                        onRedeem={onRedeem}
                    />
                ))}
            </VoucherGrid>

            {vouchers.length > 0 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    disabled={loading}
                    ariaLabel="Phân trang kho voucher"
                />
            )}
        </section>
    );
}

export default VoucherStoreList;
