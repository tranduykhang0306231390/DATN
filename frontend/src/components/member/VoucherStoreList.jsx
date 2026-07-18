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
                    <span>Reward catalogue</span>
                    <h2>Chọn phần thưởng dành cho bạn</h2>
                    <p>Danh sách đã được backend giới hạn theo thời gian, tồn kho và hạng hiện tại.</p>
                </div>
            </div>

            {!loading && vouchers.length > 0 && points && !hasRedeemableVoucher && (
                <div className="reward-voucher-points-notice" role="status">
                    <FaExclamationCircle aria-hidden="true" />
                    <span>Điểm hiện có chưa đủ để đổi các voucher trên trang này.</span>
                </div>
            )}

            <VoucherGrid
                items={vouchers}
                loading={loading}
                error={error}
                onRetry={onRetry}
                emptyTitle="Hiện chưa có voucher phù hợp"
                emptyDescription="Kho phần thưởng chưa có voucher phù hợp với hạng hoặc thời gian hiện tại."
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
