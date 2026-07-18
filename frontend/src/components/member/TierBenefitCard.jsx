import { FaBirthdayCake, FaCheck, FaCoins, FaStar } from "react-icons/fa";
import StatusBadge from "../customer/ui/StatusBadge";
import {
    formatMemberMoney,
    formatMemberNumber,
    getTierTone,
    toFiniteNumber,
} from "../../utils/memberRank";
import MemberRankBadge from "./MemberRankBadge";

const getRuleBenefits = (rule) => {
    if (!rule || typeof rule !== "object") return [];

    const conversionAmount = toFiniteNumber(rule.SoTienQuyDoi);
    const earnedPoints = toFiniteNumber(rule.SoDiemNhan);
    const invoiceMinimum = toFiniteNumber(rule.GiaTriHoaDonToiThieu);
    const multiplier = toFiniteNumber(rule.HeSoNhanDiem);
    const benefits = [];

    if (conversionAmount !== null && conversionAmount > 0 && earnedPoints !== null) {
        benefits.push({
            icon: FaCoins,
            label: `Nhận ${formatMemberNumber(earnedPoints)} điểm cho mỗi ${formatMemberMoney(conversionAmount)} chi tiêu`,
        });
    }

    if (
        multiplier !== null &&
        multiplier > 1 &&
        invoiceMinimum !== null &&
        invoiceMinimum > 0
    ) {
        benefits.push({
            icon: FaStar,
            label: `Hệ số ${multiplier.toLocaleString("vi-VN")}× với hóa đơn từ ${formatMemberMoney(invoiceMinimum)}`,
        });
    }

    if (Number(rule.NhanDoiSinhNhat) === 1) {
        benefits.push({
            icon: FaBirthdayCake,
            label: "Nhân đôi điểm trong ngày sinh nhật",
        });
    }

    return benefits;
};

function TierBenefitCard({ tier, index, total, membership }) {
    const isCurrent = index === membership.currentIndex;
    const isNext = index === membership.currentIndex + 1;
    const tone = getTierTone(index, total);
    const rule = tier.quy_tac || null;
    const benefits = getRuleBenefits(rule);

    return (
        <article
            className={`member-tier-benefit member-tier-benefit--${tone} ${
                isCurrent ? "is-current" : ""
            }`}
        >
            <div className="member-tier-benefit__header">
                <MemberRankBadge tier={tier} index={index} total={total} />
                {isCurrent && (
                    <StatusBadge tone="success" icon={<FaCheck />}>
                        Hạng của bạn
                    </StatusBadge>
                )}
                {isNext && !isCurrent && <StatusBadge tone="purple">Hạng kế tiếp</StatusBadge>}
            </div>

            <p className="member-tier-benefit__threshold">
                Mốc hạng: <strong>{formatMemberNumber(tier.DiemToiThieu)} điểm</strong>
            </p>

            {tier.MoTa && <p className="member-tier-benefit__description">{tier.MoTa}</p>}

            {benefits.length > 0 ? (
                <ul className="member-tier-benefit__list">
                    {benefits.map(({ icon: Icon, label }) => (
                        <li key={label}>
                            <Icon aria-hidden="true" />
                            <span>{label}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="member-tier-benefit__empty">
                    Chưa có mô tả quy tắc tích điểm cho hạng này.
                </p>
            )}

            {rule?.TrangThai && rule.TrangThai !== "HoatDong" && (
                <StatusBadge tone="warning">Quy tắc hiện tạm ngưng</StatusBadge>
            )}

            {isNext && membership.remainingPoints !== null && (
                <p className="member-tier-benefit__motivation">
                    Tích thêm <strong>{formatMemberNumber(membership.remainingPoints)} điểm</strong> để
                    tiến tới hạng này.
                </p>
            )}
        </article>
    );
}

export default TierBenefitCard;
