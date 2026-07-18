import { Link } from "react-router-dom";
import {
    FaBan,
    FaCalendarAlt,
    FaCheck,
    FaClock,
    FaGift,
    FaLock,
    FaStar,
    FaTag,
    FaTicketAlt,
} from "react-icons/fa";
import StatusBadge from "../customer/ui/StatusBadge";
import { formatMemberNumber } from "../../utils/memberRank";
import {
    formatVoucherDate,
    formatVoucherValue,
    getVoucherCardTone,
    getVoucherOffer,
    getVoucherTypeLabel,
} from "../../utils/voucher";

const getStatusIcon = (statusKey) => {
    if (["available", "owned-available"].includes(statusKey)) return <FaCheck />;
    if (statusKey === "processing") return <FaClock />;
    if (["expired", "out-of-stock"].includes(statusKey)) return <FaBan />;
    if (["insufficient", "rank-mismatch"].includes(statusKey)) return <FaLock />;
    return <FaTag />;
};

const isEnabledFlag = (value) => value === true || value === 1 || value === "1";

function VoucherCard({
    voucher,
    mode = "store",
    status,
    onRedeem,
    actionTo = "/member/rank?tab=vouchers",
}) {
    const offer = getVoucherOffer(voucher);
    if (!offer) return null;

    const isOwned = mode === "owned";
    const isFeatured = mode === "featured";
    const defaultTone = getVoucherCardTone(offer);
    const tone = status?.cardTone && status.cardTone !== "muted"
        ? status.cardTone
        : defaultTone;
    const isMuted = status?.cardTone === "muted";
    const expiryDate = isOwned ? voucher.NgayHetHan : offer.NgayKetThuc;

    return (
        <article
            className={`reward-voucher-card reward-voucher-card--${tone} ${
                isMuted ? "is-muted" : ""
            } ${isFeatured ? "is-featured" : ""}`}
        >
            <span className="reward-voucher-card__notch reward-voucher-card__notch--top" aria-hidden="true" />
            <span className="reward-voucher-card__notch reward-voucher-card__notch--bottom" aria-hidden="true" />

            <header className="reward-voucher-card__header">
                <span className="reward-voucher-card__type">
                    <FaTicketAlt aria-hidden="true" />
                    {getVoucherTypeLabel(offer)}
                </span>
                {status && (
                    <StatusBadge tone={status.tone} icon={getStatusIcon(status.key)}>
                        {status.label}
                    </StatusBadge>
                )}
            </header>

            <div className="reward-voucher-card__value">{formatVoucherValue(offer)}</div>
            <h3>{offer.TenUuDai || "Voucher thành viên"}</h3>
            {offer.MoTa ? (
                <p className="reward-voucher-card__description">{offer.MoTa}</p>
            ) : (
                <p className="reward-voucher-card__description is-empty">
                    Chưa có mô tả điều kiện bổ sung.
                </p>
            )}

            <dl className="reward-voucher-card__meta">
                <div>
                    <dt><FaCalendarAlt aria-hidden="true" />Hạn sử dụng</dt>
                    <dd>{formatVoucherDate(expiryDate)}</dd>
                </div>

                {isOwned ? (
                    <div>
                        <dt>Ngày nhận</dt>
                        <dd>{formatVoucherDate(voucher.NgayCap)}</dd>
                    </div>
                ) : (
                    <div>
                        <dt>Số lượng còn</dt>
                        <dd>{formatMemberNumber(offer.SoLuongTon)}</dd>
                    </div>
                )}

                {isOwned && voucher.NgaySuDung && (
                    <div>
                        <dt>Ngày sử dụng</dt>
                        <dd>{formatVoucherDate(voucher.NgaySuDung)}</dd>
                    </div>
                )}
            </dl>

            <footer className="reward-voucher-card__footer">
                <div className="reward-voucher-card__points">
                    <FaStar aria-hidden="true" />
                    <span>
                        <small>{isOwned ? "Mức điểm voucher" : "Điểm cần đổi"}</small>
                        <strong>{formatMemberNumber(offer.SoDiemCanDoi)}</strong>
                    </span>
                </div>

                {mode === "store" && (
                    <button
                        type="button"
                        className="customer-button customer-button--primary reward-voucher-card__action"
                        onClick={() => onRedeem?.(offer)}
                        disabled={!status?.canRedeem}
                        aria-describedby={`voucher-status-${offer.MaUuDai}`}
                    >
                        {status?.key === "processing" ? "Đang xử lý…" : "Đổi voucher"}
                    </button>
                )}

                {isFeatured && (
                    <Link
                        to={actionTo}
                        className="customer-button customer-button--primary reward-voucher-card__action"
                    >
                        Xem trong kho
                    </Link>
                )}
            </footer>

            {mode === "store" && status && (
                <p
                    id={`voucher-status-${offer.MaUuDai}`}
                    className={`reward-voucher-card__reason ${status.canRedeem ? "is-ready" : ""}`}
                >
                    {status.key === "insufficient" && status.missingPoints
                        ? `Cần thêm ${formatMemberNumber(status.missingPoints)} điểm.`
                        : status.reason}
                </p>
            )}

            {isEnabledFlag(offer.CoTheDungChung) && (
                <span className="reward-voucher-card__stackable">
                    <FaGift aria-hidden="true" /> Có thể dùng chung
                </span>
            )}
        </article>
    );
}

export default VoucherCard;
