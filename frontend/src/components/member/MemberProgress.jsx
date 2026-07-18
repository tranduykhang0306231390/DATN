import { FaCrown, FaExclamationTriangle, FaLock, FaStar } from "react-icons/fa";
import EmptyState from "../customer/ui/EmptyState";
import StatusBadge from "../customer/ui/StatusBadge";
import { formatMemberMoney, formatMemberNumber } from "../../utils/memberRank";
import MemberRankBadge from "./MemberRankBadge";

const EMPTY_STATE_CONTENT = {
    "no-config": {
        title: "Chưa có cấu hình hạng thành viên",
        description: "Hệ thống chưa cung cấp các mốc hạng. Điểm hiện tại của bạn không bị thay đổi.",
    },
    "no-rank": {
        title: "Tài khoản chưa được gán hạng",
        description: "Thông tin điểm vẫn được giữ nguyên, nhưng chưa thể tính tiến trình thăng hạng.",
    },
    "unknown-rank": {
        title: "Không tìm thấy cấu hình của hạng hiện tại",
        description: "Mã hạng tài khoản chưa khớp với danh sách cấu hình đang hoạt động.",
    },
};

function MemberProgress({ membership }) {
    if (!membership) return null;

    const emptyContent = EMPTY_STATE_CONTENT[membership.status];

    if (emptyContent) {
        return (
            <EmptyState
                title={emptyContent.title}
                description={emptyContent.description}
                icon={<FaLock />}
                as="h3"
            />
        );
    }

    const {
        currentTier,
        nextTier,
        currentIndex,
        ranks,
        currentPoints,
        currentThreshold,
        nextThreshold,
        currentSpendThreshold,
        nextSpendThreshold,
        percentage,
        remainingPoints,
        remainingSpend,
        isHighestTier,
        hasReachedNextThreshold,
        hasReachedSpendThreshold,
        isEligibleForNextTier,
        hasEqualThresholds,
        hasInvalidThresholdOrder,
        status,
    } = membership;
    const roundedPercentage = Math.round(percentage);
    const hasValidProgress = status !== "invalid-threshold" && status !== "no-points";

    return (
        <section className="member-progress-card" aria-labelledby="membership-progress-title">
            <div className="member-progress-card__header">
                <div>
                    <span className="member-progress-card__eyebrow">Hành trình của bạn</span>
                    <h3 id="membership-progress-title">Tiến trình thăng hạng</h3>
                </div>
                {isHighestTier ? (
                    <StatusBadge tone="purple" icon={<FaCrown />}>
                        Hạng cao nhất
                    </StatusBadge>
                ) : (
                    <StatusBadge tone="warning" icon={<FaStar />}>
                        {roundedPercentage}% hoàn thành
                    </StatusBadge>
                )}
            </div>

            <div className="member-progress-card__tiers">
                <div>
                    <small>Hạng hiện tại</small>
                    <MemberRankBadge
                        tier={currentTier}
                        index={currentIndex}
                        total={ranks.length}
                        size="small"
                    />
                </div>
                <span aria-hidden="true">→</span>
                <div className="member-progress-card__next-tier">
                    <small>{isHighestTier ? "Trạng thái" : "Hạng kế tiếp"}</small>
                    {nextTier ? (
                        <MemberRankBadge
                            tier={nextTier}
                            index={currentIndex + 1}
                            total={ranks.length}
                            size="small"
                        />
                    ) : (
                        <strong>Đã hoàn tất hành trình</strong>
                    )}
                </div>
            </div>

            <div
                className={`member-progress-track ${isHighestTier ? "is-complete" : ""}`}
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={hasValidProgress ? roundedPercentage : 0}
                aria-label={
                    isHighestTier
                        ? "Bạn đã đạt hạng thành viên cao nhất"
                        : `Tiến trình từ hạng ${currentTier?.TenHang || "hiện tại"} đến hạng ${nextTier?.TenHang || "kế tiếp"}`
                }
                aria-valuetext={
                    hasValidProgress
                        ? `${roundedPercentage}% hoàn thành`
                        : "Chưa đủ dữ liệu để tính tiến trình"
                }
            >
                <span
                    className="member-progress-track__fill"
                    style={{ "--member-progress-scale": percentage / 100 }}
                />
            </div>

            <div className="member-progress-card__boundaries">
                <span>
                    <strong>{currentTier?.TenHang || "Hạng hiện tại"}</strong>
                    {formatMemberNumber(currentThreshold)} điểm
                    {" · "}
                    {formatMemberMoney(currentSpendThreshold)}
                </span>
                <span>
                    <strong>{nextTier?.TenHang || currentTier?.TenHang || "Hạng cao nhất"}</strong>
                    {formatMemberNumber(nextThreshold ?? currentThreshold)} điểm
                    {" · "}
                    {formatMemberMoney(nextSpendThreshold ?? currentSpendThreshold)}
                </span>
            </div>

            <div className="member-progress-card__message">
                {status === "no-points" && (
                    <p>
                        <FaExclamationTriangle aria-hidden="true" />
                        Chưa có dữ liệu điểm để tính tiến trình.
                    </p>
                )}
                {status === "invalid-threshold" && (
                    <p>
                        <FaExclamationTriangle aria-hidden="true" />
                        Cấu hình ngưỡng điểm chưa đầy đủ nên chưa thể tính tiến trình.
                    </p>
                )}
                {hasEqualThresholds && !isHighestTier && (
                    <p>
                        <FaExclamationTriangle aria-hidden="true" />
                        Hai hạng đang có cùng ngưỡng điểm; tiến trình được chuẩn hóa an toàn.
                    </p>
                )}
                {hasInvalidThresholdOrder && !isHighestTier && (
                    <p>
                        <FaExclamationTriangle aria-hidden="true" />
                        Ngưỡng điểm của hạng kế tiếp đang thấp hơn hạng hiện tại; tiến trình được giới hạn an toàn trong khoảng 0–100%.
                    </p>
                )}
                {isHighestTier && (
                    <p className="is-celebration">
                        <FaCrown aria-hidden="true" />
                        Bạn đã đạt hạng cao nhất. Hãy tiếp tục tận hưởng các quyền lợi hiện có.
                    </p>
                )}
                {!isHighestTier && isEligibleForNextTier && (
                    <p className="is-ready">
                        <FaStar aria-hidden="true" />
                        Bạn đã đủ điểm và chi tiêu cho hạng {nextTier?.TenHang}. Hạng sẽ được cập nhật ở giao dịch gần nhất.
                    </p>
                )}
                {!isHighestTier && !isEligibleForNextTier && hasReachedNextThreshold && !hasReachedSpendThreshold && (
                    <p>
                        Bạn đã đủ điểm cho hạng <strong>{nextTier?.TenHang}</strong>, nhưng cần chi tiêu thêm{" "}
                        <strong>{formatMemberMoney(remainingSpend)}</strong> nữa để đủ điều kiện.
                    </p>
                )}
                {!isHighestTier && !isEligibleForNextTier && !hasReachedNextThreshold && hasReachedSpendThreshold && remainingPoints !== null && (
                    <p>
                        Bạn đã đủ điều kiện chi tiêu cho hạng <strong>{nextTier?.TenHang}</strong>, nhưng cần tích thêm{" "}
                        <strong>{formatMemberNumber(remainingPoints)} điểm</strong> nữa để đủ điều kiện.
                    </p>
                )}
                {!isHighestTier && !hasReachedNextThreshold && !hasReachedSpendThreshold && remainingPoints !== null && (
                    <p>
                        Còn <strong>{formatMemberNumber(remainingPoints)} điểm</strong> và{" "}
                        <strong>{formatMemberMoney(remainingSpend)}</strong> để đạt hạng <strong>{nextTier?.TenHang}</strong>.
                        Điểm hiện tại: <strong>{formatMemberNumber(currentPoints)}</strong>.
                    </p>
                )}
            </div>
        </section>
    );
}

export default MemberProgress;
