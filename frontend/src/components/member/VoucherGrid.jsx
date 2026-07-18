import { FaExclamationTriangle, FaGift } from "react-icons/fa";
import EmptyState from "../customer/ui/EmptyState";
import ErrorState from "../customer/ui/ErrorState";
import LoadingSkeleton from "../customer/ui/LoadingSkeleton";

function VoucherGrid({
    items,
    loading,
    error,
    onRetry,
    emptyTitle,
    emptyDescription,
    children,
}) {
    const safeItems = Array.isArray(items) ? items : [];

    if (loading && safeItems.length === 0) {
        return (
            <div className="reward-voucher-grid" aria-label="Đang tải danh sách voucher">
                {[0, 1, 2].map((item) => (
                    <div className="reward-voucher-skeleton" key={item}>
                        <LoadingSkeleton lines={6} ariaLabel="Đang tải voucher" />
                    </div>
                ))}
            </div>
        );
    }

    if (error && safeItems.length === 0) {
        return (
            <ErrorState
                title="Không thể tải danh sách voucher"
                description="Dữ liệu voucher chưa thể tải lúc này. Bạn có thể thử lại mà không ảnh hưởng tài khoản."
                icon={<FaExclamationTriangle />}
                onRetry={onRetry}
                as="h3"
            />
        );
    }

    if (safeItems.length === 0) {
        return (
            <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                icon={<FaGift />}
                as="h3"
            />
        );
    }

    return (
        <>
            {error && (
                <div className="reward-voucher-refresh-error" role="status">
                    <FaExclamationTriangle aria-hidden="true" />
                    <span>Không thể làm mới. Dữ liệu gần nhất vẫn đang được giữ lại.</span>
                    <button type="button" onClick={onRetry}>Thử lại</button>
                </div>
            )}
            <div className="reward-voucher-grid">{children}</div>
        </>
    );
}

export default VoucherGrid;
