import VoucherCard from "./VoucherCard";
import { getStoreVoucherStatus } from "../../utils/voucher";

function VoucherStoreCard({
    voucher,
    points,
    submittingVoucherId,
    onRedeem,
}) {
    const status = getStoreVoucherStatus({
        voucher,
        currentPoints: points?.TongDiem,
        memberRankCode: points?.HangThanhVien,
        isSubmitting: submittingVoucherId === voucher.MaUuDai,
    });

    return (
        <VoucherCard
            voucher={voucher}
            mode="store"
            status={status}
            onRedeem={onRedeem}
        />
    );
}

export default VoucherStoreCard;
