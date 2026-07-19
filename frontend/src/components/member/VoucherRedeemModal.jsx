import { FaExclamationTriangle, FaGift, FaStar } from "react-icons/fa";
import CustomerModal from "../customer/ui/CustomerModal";
import {
    formatVoucherValue,
    getVoucherOffer,
    getVoucherPreviewPoints,
} from "../../utils/voucher";
import { formatMemberNumber } from "../../utils/memberRank";

function VoucherRedeemModal({
    voucher,
    currentPoints,
    open,
    submitting,
    error,
    onClose,
    onConfirm,
}) {
    const offer = getVoucherOffer(voucher);
    const requiredPoints = offer?.SoDiemCanDoi;
    const previewPoints = getVoucherPreviewPoints(currentPoints, requiredPoints);

    return (
        <CustomerModal
            open={open && Boolean(offer)}
            onClose={onClose}
            title="Xác nhận đổi voucher"
            eyebrow="Đổi điểm nhận quà"
            busy={submitting}
            closeOnBackdrop={!submitting}
            className="voucher-redeem-dialog"
            titleId="voucher-redeem-title"
            footer={
                <>
                    <button
                        type="button"
                        className="customer-button customer-button--secondary"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="customer-button customer-button--primary voucher-redeem-dialog__confirm"
                        onClick={onConfirm}
                        disabled={submitting}
                    >
                        {submitting ? "Đang đổi…" : "Xác nhận đổi"}
                    </button>
                </>
            }
        >
            {offer && (
                <>
                    <div className="voucher-redeem-dialog__hero">
                        <span aria-hidden="true"><FaGift /></span>
                        <div>
                            <small>{formatVoucherValue(offer)}</small>
                            <strong>{offer.TenUuDai || "Voucher thành viên"}</strong>
                            {offer.MoTa && <p>{offer.MoTa}</p>}
                        </div>
                    </div>

                    <dl className="voucher-redeem-dialog__points">
                        <div>
                            <dt>Điểm hiện có</dt>
                            <dd><FaStar aria-hidden="true" />{formatMemberNumber(currentPoints)}</dd>
                        </div>
                        <div>
                            <dt>Điểm cần đổi</dt>
                            <dd>{requiredPoints > 0 ? `−${formatMemberNumber(requiredPoints)}` : "Miễn phí"}</dd>
                        </div>
                        <div className="is-remaining">
                            <dt>Dự kiến còn lại</dt>
                            <dd>{formatMemberNumber(previewPoints)}</dd>
                        </div>
                    </dl>

                    {error && (
                        <div className="voucher-redeem-dialog__error" role="alert">
                            <FaExclamationTriangle aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}
                </>
            )}
        </CustomerModal>
    );
}

export default VoucherRedeemModal;
