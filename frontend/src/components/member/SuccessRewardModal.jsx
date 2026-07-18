import { FaCheck, FaGift, FaStar } from "react-icons/fa";
import CustomerModal from "../customer/ui/CustomerModal";
import { formatMemberNumber } from "../../utils/memberRank";
import { getVoucherOffer } from "../../utils/voucher";

function SuccessRewardModal({
    open,
    voucher,
    pointsUsed,
    remainingPoints,
    onClose,
    onViewMine,
}) {
    const offer = getVoucherOffer(voucher);

    return (
        <CustomerModal
            open={open && Boolean(offer)}
            onClose={onClose}
            title="Đổi voucher thành công"
            eyebrow="Reward unlocked"
            className="voucher-success-dialog"
            titleId="voucher-success-title"
            footer={
                <>
                    <button
                        type="button"
                        className="customer-button customer-button--secondary"
                        onClick={onClose}
                    >
                        Tiếp tục xem
                    </button>
                    <button
                        type="button"
                        className="customer-button customer-button--primary"
                        onClick={onViewMine}
                    >
                        Voucher của tôi
                    </button>
                </>
            }
        >
            {offer && (
                <div className="voucher-success-dialog__content" role="status" aria-live="polite">
                    <div className="voucher-success-dialog__icon" aria-hidden="true">
                        <FaCheck />
                        <span><FaStar /></span>
                    </div>
                    <p>Phần thưởng đã được thêm vào tài khoản của bạn.</p>
                    <strong><FaGift aria-hidden="true" />{offer.TenUuDai}</strong>
                    <dl>
                        <div>
                            <dt>Điểm đã dùng</dt>
                            <dd>{formatMemberNumber(pointsUsed)}</dd>
                        </div>
                        {remainingPoints !== null && remainingPoints !== undefined && (
                            <div>
                                <dt>Điểm hiện còn</dt>
                                <dd>{formatMemberNumber(remainingPoints)}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            )}
        </CustomerModal>
    );
}

export default SuccessRewardModal;
