import Voucher from "../../pages/member/Voucher";

function VoucherPanel({ view = "store", onViewChange }) {
    return <Voucher view={view} onViewChange={onViewChange} />;
}

export default VoucherPanel;
