import VoucherCard from "./VoucherCard";
import { getOwnedVoucherStatus } from "../../utils/voucher";

function MyVoucherCard({ voucher }) {
    return (
        <VoucherCard
            voucher={voucher}
            mode="owned"
            status={getOwnedVoucherStatus(voucher)}
        />
    );
}

export default MyVoucherCard;
