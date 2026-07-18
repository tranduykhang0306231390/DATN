import { FaCoins, FaReceipt, FaWallet } from "react-icons/fa";
import {
    formatMemberMoney,
    formatMemberNumber,
} from "../../utils/memberRank";

function MemberPointSummary({ points }) {
    if (!points) return null;

    const metrics = [
        {
            key: "earned",
            label: "Điểm đã nhận",
            value: formatMemberNumber(points.TongDiemNhan),
            icon: FaCoins,
            tone: "green",
        },
        {
            key: "used",
            label: "Điểm đã sử dụng",
            value: formatMemberNumber(points.TongDiemDaDung),
            icon: FaWallet,
            tone: "coral",
        },
        {
            key: "invoices",
            label: "Tổng hóa đơn",
            value: formatMemberNumber(points.TongHoaDon),
            icon: FaReceipt,
            tone: "cyan",
        },
        {
            key: "spending",
            label: "Tổng chi tiêu",
            value: formatMemberMoney(points.TongChiTieu),
            icon: FaWallet,
            tone: "purple",
        },
    ];

    return (
        <div className="member-points-summary">
            <div className="member-points-summary__metrics">
                {metrics.map(({ key, label, value, icon: Icon, tone }) => (
                    <article key={key} className={`member-point-metric member-point-metric--${tone}`}>
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                        <strong>{value}</strong>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default MemberPointSummary;
