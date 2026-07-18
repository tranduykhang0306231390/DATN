import { useEffect, useMemo, useState } from "react";
import {
    FaExclamationTriangle,
    FaGift,
    FaSyncAlt,
} from "react-icons/fa";

import { getMemberPoints, getMemberProfile } from "../../api/authApi";
import { getMemberRanks } from "../../api/memberRankApi";
import EmptyState from "../customer/ui/EmptyState";
import ErrorState from "../customer/ui/ErrorState";
import LoadingSkeleton from "../customer/ui/LoadingSkeleton";
import SectionHeading from "../customer/ui/SectionHeading";
import MemberCard from "./MemberCard";
import MemberPointSummary from "./MemberPointSummary";
import MemberProfileSummary from "./MemberProfile";
import MemberProgress from "./MemberProgress";
import RankHistoryModal from "./RankHistoryModal";
import TierBenefitCard from "./TierBenefitCard";
import TierJourney from "./TierJourney";
import { buildMembershipState } from "../../utils/memberRank";
import {
    syncStoredCustomerPoints,
    syncStoredCustomerUser,
} from "../../utils/customerSession";

function RankOverviewLoading() {
    return (
        <div className="member-rank-loading" role="status" aria-label="Đang tải thông tin thành viên">
            <LoadingSkeleton lines={5} ariaLabel="Đang tải thẻ thành viên" />
            <LoadingSkeleton lines={3} ariaLabel="Đang tải hồ sơ thành viên" />
            <LoadingSkeleton lines={4} ariaLabel="Đang tải tiến trình hạng" />
            <LoadingSkeleton lines={4} ariaLabel="Đang tải thống kê điểm" />
        </div>
    );
}

function RankOverviewPanel({ activeModal, onRequestModal, onCloseModal }) {
    const [user, setUser] = useState(null);
    const [points, setPoints] = useState(null);
    const [ranks, setRanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [rankConfigError, setRankConfigError] = useState(null);
    const [requestKey, setRequestKey] = useState(0);
    const [showRankHistory, setShowRankHistory] = useState(false);

    useEffect(() => {
        let active = true;

        Promise.allSettled([
            getMemberProfile(),
            getMemberPoints(),
            getMemberRanks(),
        ])
            .then(([profileResult, pointResult, rankResult]) => {
                if (!active) return;
                if (profileResult.status === "rejected") throw profileResult.reason;

                const profile = profileResult.value.data?.user || null;
                setUser(profile);
                if (profile) syncStoredCustomerUser(profile);

                if (pointResult.status === "fulfilled") {
                    const pointPayload = pointResult.value.data || null;
                    setPoints(pointPayload);
                    setError(null);
                    syncStoredCustomerPoints(pointPayload);
                } else {
                    setPoints(null);
                    setError(pointResult.reason);
                }

                if (rankResult.status === "fulfilled") {
                    const rankPayload = rankResult.value.data?.data;
                    setRanks(Array.isArray(rankPayload) ? rankPayload : []);
                    setRankConfigError(null);
                } else {
                    setRanks([]);
                    setRankConfigError(rankResult.reason);
                }
            })
            .catch((requestError) => {
                if (active) setError(requestError);
            })
            .finally(() => {
                if (!active) return;
                setLoading(false);
                setRefreshing(false);
            });

        return () => {
            active = false;
        };
    }, [requestKey]);

    const displayPoints = useMemo(() => points || ({
        TongDiem: user?.TongDiem,
        HangThanhVien: user?.MaHangThanhVien || user?.HangThanhVien,
    }), [points, user]);

    const membership = useMemo(
        () => buildMembershipState(displayPoints, ranks),
        [displayPoints, ranks],
    );

    const handleRetry = () => {
        if (user) setRefreshing(true);
        else setLoading(true);
        setError(null);
        setRankConfigError(null);
        setRequestKey((current) => current + 1);
    };

    const handleProfileUpdated = (updatedUser) => {
        setUser((current) => ({ ...(current || {}), ...(updatedUser || {}) }));
    };

    if (loading && !user) return <RankOverviewLoading />;

    if (!loading && !user) {
        const unauthorized = error?.response?.status === 401;
        return (
            <ErrorState
                title={unauthorized ? "Phiên đăng nhập đã hết hạn" : "Không thể tải tài khoản"}
                description={unauthorized
                    ? "Vui lòng đăng nhập lại để tiếp tục."
                    : "Thông tin tài khoản chưa thể tải lúc này. Bạn có thể thử lại mà không ảnh hưởng dữ liệu."}
                onRetry={unauthorized ? undefined : handleRetry}
                icon={<FaExclamationTriangle />}
            />
        );
    }

    return (
        <div className="rank-overview-panel">
            {refreshing && (
                <div className="member-rank-refreshing" role="status">
                    <FaSyncAlt aria-hidden="true" /> Đang làm mới dữ liệu…
                </div>
            )}

            <section className="member-rank-section member-rank-section--membership-card" aria-label="Thẻ thành viên">
                <MemberCard
                    user={user}
                    points={displayPoints}
                    membership={membership}
                    onShowHistory={() => setShowRankHistory(true)}
                />
            </section>

            <section className="member-rank-section" aria-label="Thông tin cá nhân">
                <MemberProfileSummary
                    user={user}
                    activeModal={activeModal}
                    onRequestModal={onRequestModal}
                    onCloseModal={onCloseModal}
                    onProfileUpdated={handleProfileUpdated}
                />
            </section>

            {error && (
                <div className="member-rank-notice member-rank-notice--error" role="status">
                    <FaExclamationTriangle aria-hidden="true" />
                    <span>Chưa tải được điểm hiện tại. Hồ sơ của bạn vẫn được giữ nguyên.</span>
                    <button type="button" onClick={handleRetry}>Thử lại</button>
                </div>
            )}

            {points && (
                <>
                    <section className="member-rank-section" aria-label="Tiến trình thăng hạng">
                        <MemberProgress membership={membership} />
                    </section>

                    <section className="member-rank-section member-rank-section--point-summary" aria-labelledby="member-point-summary-title">
                        <SectionHeading
                            eyebrow="Hoạt động thành viên"
                            title="Thống kê điểm"
                            description="Tổng hợp điểm, hóa đơn và chi tiêu từ dữ liệu tài khoản hiện tại."
                            as="h2"
                            id="member-point-summary-title"
                        />
                        <MemberPointSummary points={points} />
                    </section>
                </>
            )}

            {rankConfigError && (
                <div className="member-rank-notice member-rank-notice--warning" role="status">
                    <FaExclamationTriangle aria-hidden="true" />
                    <span>Chưa tải được cấu hình các mốc hạng. Điểm hiện tại vẫn hiển thị bình thường.</span>
                    <button type="button" onClick={handleRetry}>Thử lại</button>
                </div>
            )}

            {!rankConfigError && membership.ranks.length > 0 && (
                <section className="member-rank-section" aria-labelledby="tier-journey-title">
                    <SectionHeading
                        eyebrow="Các mốc hạng"
                        title="Quyền lợi theo hạng"
                        description="Chỉ các mốc và quyền lợi đang có trong cấu hình hệ thống được hiển thị."
                        as="h2"
                        id="tier-journey-title"
                    />
                    <TierJourney membership={membership} />
                    <details className="member-tier-benefits-disclosure">
                        <summary>Xem chi tiết quyền lợi và quy tắc tích điểm</summary>
                        <div className="member-tier-benefits-grid">
                            {membership.ranks.map((tier, index) => (
                                <TierBenefitCard
                                    key={tier.MaHangThanhVien || `${tier.TenHang}-${index}`}
                                    tier={tier}
                                    index={index}
                                    total={membership.ranks.length}
                                    membership={membership}
                                />
                            ))}
                        </div>
                    </details>
                </section>
            )}

            {!rankConfigError && !loading && membership.ranks.length === 0 && (
                <EmptyState
                    title="Chưa có cấu hình quyền lợi theo hạng"
                    description="Hệ thống hiện chưa có mốc hạng hoặc quyền lợi để hiển thị."
                    icon={<FaGift />}
                    as="h3"
                />
            )}

            <RankHistoryModal
                show={showRankHistory}
                onClose={() => setShowRankHistory(false)}
                membership={membership}
                joinedAt={user?.NgayDangKy}
            />
        </div>
    );
}

export default RankOverviewPanel;
