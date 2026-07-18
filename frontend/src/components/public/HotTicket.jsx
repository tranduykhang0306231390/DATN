import { useEffect, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";

import { getHotTickets } from "../../api/ticketApi";
import EmptyState from "../customer/ui/EmptyState";
import ErrorState from "../customer/ui/ErrorState";
import LoadingSkeleton from "../customer/ui/LoadingSkeleton";

const getMealLabel = (meal) => ({
    Sang: "Buổi sáng",
    Trua: "Buổi trưa",
    Toi: "Buổi tối",
}[meal] || meal || "Chưa xác định");

const getDayTypeLabel = (dayType) => ({
    NgayThuong: "Ngày thường",
    CuoiTuan: "Cuối tuần",
    LeTet: "Lễ / Tết",
}[dayType] || dayType || "Chưa xác định");

const formatTicketPrice = (value) => {
    const price = Number(value);
    return Number.isFinite(price) && price >= 0
        ? `${price.toLocaleString("vi-VN")} ₫`
        : "Liên hệ";
};

function HotTicket() {
    const [tickets, setTickets] = useState([]);
    const [status, setStatus] = useState("loading");
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let active = true;

        getHotTickets()
            .then((response) => {
                if (!active) return;
                setTickets(Array.isArray(response.data?.data) ? response.data.data : []);
                setStatus("success");
            })
            .catch(() => {
                if (active) setStatus("error");
            });

        return () => {
            active = false;
        };
    }, [retryKey]);

    return (
        <section className="ticket-section" id="ticket" aria-labelledby="public-hot-ticket-title">
            <div className="container">
                <span className="ticket-eyebrow">Buffet Premium</span>
                <h2 id="public-hot-ticket-title">Loại vé nổi bật</h2>
                <p className="ticket-subtitle">
                    Khám phá các loại vé đang được giới thiệu trong hệ thống.
                </p>

                {status === "loading" && (
                    <div className="ticket-grid" aria-label="Đang tải loại vé nổi bật">
                        {[1, 2, 3].map((item) => (
                            <div className="ticket-card" key={item}>
                                <LoadingSkeleton lines={4} />
                            </div>
                        ))}
                    </div>
                )}

                {status === "error" && (
                    <ErrorState
                        title="Chưa thể tải loại vé"
                        description="Vui lòng kiểm tra kết nối và thử lại."
                        onRetry={() => {
                            setStatus("loading");
                            setRetryKey((current) => current + 1);
                        }}
                    />
                )}

                {status === "success" && tickets.length === 0 && (
                    <EmptyState
                        icon={<FaTicketAlt />}
                        title="Chưa có loại vé nổi bật"
                        description="Các loại vé mới sẽ xuất hiện tại đây khi được cập nhật."
                    />
                )}

                {status === "success" && tickets.length > 0 && (
                    <div className="ticket-grid">
                        {tickets.map((ticket) => (
                            <article className="ticket-card" key={ticket.MaLoaiVe}>
                                <span className="ticket-hole left" aria-hidden="true" />
                                <span className="ticket-hole right" aria-hidden="true" />
                                <div className="ticket-top">
                                    <span className="ticket-type">{getMealLabel(ticket.BuoiAn)}</span>
                                    <h3>{ticket.TenLoaiVe || "Loại vé"}</h3>
                                </div>
                                <div className="ticket-divider" aria-hidden="true" />
                                <div className="ticket-info">
                                    <p><span>Loại ngày</span><strong>{getDayTypeLabel(ticket.LoaiNgay)}</strong></p>
                                </div>
                                <div className="ticket-price">{formatTicketPrice(ticket.GiaVe)}</div>
                                <div className="ticket-footer"><span>Buffet</span></div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default HotTicket;
