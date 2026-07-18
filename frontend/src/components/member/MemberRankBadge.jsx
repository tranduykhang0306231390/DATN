import { FaCrown, FaGem, FaMedal, FaStar } from "react-icons/fa";
import { getTierTone } from "../../utils/memberRank";

function RankIcon({ index, total }) {
    if (index === total - 1 && total > 1) return <FaGem aria-hidden="true" />;
    if (index === total - 2 && total > 2) return <FaCrown aria-hidden="true" />;
    if (index > 0) return <FaMedal aria-hidden="true" />;
    return <FaStar aria-hidden="true" />;
}

function MemberRankBadge({ tier, index = 0, total = 1, size = "medium" }) {
    if (!tier) return null;

    const tone = getTierTone(index, total);
    const rankName = tier.TenHang || tier.MaHangThanhVien || "Chưa xác định";

    return (
        <span
            className={`member-rank-badge member-rank-badge--${tone} member-rank-badge--${size}`}
            aria-label={`Hạng thành viên: ${rankName}`}
        >
            <RankIcon index={index} total={total} />
            <span>{rankName}</span>
        </span>
    );
}

export default MemberRankBadge;
