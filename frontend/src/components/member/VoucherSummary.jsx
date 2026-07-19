import { FaGift, FaStar, FaWallet } from "react-icons/fa";
import { formatMemberNumber } from "../../utils/memberRank";

function VoucherSummary({ points, pointsLoading, storeCount, ownedCount }) {
    const showOwnedCount = ownedCount !== null && ownedCount !== undefined;

    return (
        <section
            className={`reward-voucher-summary ${showOwnedCount ? "" : "reward-voucher-summary--compact"}`.trim()}
            aria-label="Tổng quan voucher"
        >
            <article className="reward-voucher-summary__points">
                <span aria-hidden="true"><FaStar /></span>
                <div>
                    <small>Điểm hiện có</small>
                    <strong>{pointsLoading ? "…" : formatMemberNumber(points?.TongDiem)}</strong>
                </div>
            </article>
            <article>
                <FaGift aria-hidden="true" />
                <small>Ưu đãi đang mở</small>
                <strong>{formatMemberNumber(storeCount, "0")}</strong>
            </article>
            {showOwnedCount && (
                <article>
                    <FaWallet aria-hidden="true" />
                    <small>Voucher đang sở hữu</small>
                    <strong>{formatMemberNumber(ownedCount, "0")}</strong>
                </article>
            )}
        </section>
    );
}

export default VoucherSummary;
