import { FaCalendarAlt, FaHistory, FaStar } from "react-icons/fa";
import {
    formatMemberDate,
    formatMemberNumber,
    getTierTone,
} from "../../utils/memberRank";
import MemberRankBadge from "./MemberRankBadge";

function MemberCard({ user, points, membership, onShowHistory }) {
    if (!user || !points || !membership) return null;

    const currentTier = membership.currentTier;
    const tone = currentTier
        ? getTierTone(membership.currentIndex, membership.ranks.length)
        : "green";

    return (
        <article className={`member-loyalty-card member-loyalty-card--${tone}`}>
            <div className="member-loyalty-card__shape member-loyalty-card__shape--one" aria-hidden="true" />
            <div className="member-loyalty-card__shape member-loyalty-card__shape--two" aria-hidden="true" />

            <div className="member-loyalty-card__content">
                <div className="member-loyalty-card__brand">
                    <span>BUFFET</span>
                </div>

                <div className="member-loyalty-card__identity">
                    <p>Thành viên</p>
                    <h2>{user.HoTen || "—"}</h2>
                </div>

                <div className="member-loyalty-card__rank">
                    {currentTier ? (
                        <MemberRankBadge
                            tier={currentTier}
                            index={membership.currentIndex}
                            total={membership.ranks.length}
                        />
                    ) : (
                        <span className="member-loyalty-card__unknown-rank">
                            {points.HangThanhVien || "Chưa có hạng"}
                        </span>
                    )}
                </div>

                <div className="member-loyalty-card__footer">
                    <div className="member-loyalty-card__stats">
                        <div className="member-loyalty-card__points" aria-label={`Điểm hiện có: ${formatMemberNumber(points.TongDiem)}`}>
                            <FaStar aria-hidden="true" />
                            <span>
                                <small>Điểm hiện có</small>
                                <strong>{formatMemberNumber(points.TongDiem)}</strong>
                            </span>
                        </div>

                        {user.NgayDangKy && (
                            <div className="member-loyalty-card__joined">
                                <FaCalendarAlt aria-hidden="true" />
                                <span>
                                    <small>Tham gia</small>
                                    <strong>{formatMemberDate(user.NgayDangKy)}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                    {onShowHistory && (
                        <button
                            type="button"
                            className="member-loyalty-card__history"
                            onClick={onShowHistory}
                        >
                            <FaHistory aria-hidden="true" />
                            Lịch sử hạng
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}

export default MemberCard;
