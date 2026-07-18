import { FaCheck, FaLock } from "react-icons/fa";
import EmptyState from "../customer/ui/EmptyState";
import StatusBadge from "../customer/ui/StatusBadge";
import {
    formatMemberNumber,
    getTierTone,
} from "../../utils/memberRank";
import MemberRankBadge from "./MemberRankBadge";

function TierJourney({ membership }) {
    const ranks = membership?.ranks || [];

    if (ranks.length === 0) {
        return (
            <EmptyState
                title="Chưa có cấu hình hành trình hạng"
                description="Các mốc hạng chưa được hệ thống cung cấp. Điểm của bạn vẫn được giữ nguyên."
                icon={<FaLock />}
                as="h3"
            />
        );
    }

    return (
        <ol className="member-tier-journey" aria-label="Hành trình hạng thành viên">
            {ranks.map((tier, index) => {
                const isCurrent = index === membership.currentIndex;
                const isAchieved = membership.currentIndex >= 0 && index < membership.currentIndex;
                const state = isCurrent ? "current" : isAchieved ? "achieved" : "upcoming";
                const tone = getTierTone(index, ranks.length);

                return (
                    <li
                        key={tier.MaHangThanhVien || `${tier.TenHang}-${index}`}
                        className={`member-tier-step member-tier-step--${state} member-tier-step--${tone}`}
                        aria-current={isCurrent ? "step" : undefined}
                    >
                        <div className="member-tier-step__topline">
                            <MemberRankBadge
                                tier={tier}
                                index={index}
                                total={ranks.length}
                                size="small"
                            />
                            <StatusBadge
                                tone={isCurrent ? "purple" : isAchieved ? "success" : "neutral"}
                                icon={isAchieved ? <FaCheck /> : isCurrent ? null : <FaLock />}
                            >
                                {isCurrent ? "Hạng hiện tại" : isAchieved ? "Đã đạt" : "Chưa đạt"}
                            </StatusBadge>
                        </div>
                        <strong className="member-tier-step__points">
                            {formatMemberNumber(tier.DiemToiThieu)} điểm
                        </strong>
                        {tier.MoTa && <p>{tier.MoTa}</p>}
                    </li>
                );
            })}
        </ol>
    );
}

export default TierJourney;
