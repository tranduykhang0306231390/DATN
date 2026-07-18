import { useEffect, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";

import { getTickets } from "../../api/ticketApi";
import TicketCard from "../../components/member/TicketCard";
import EmptyState from "../../components/customer/ui/EmptyState";
import ErrorState from "../../components/customer/ui/ErrorState";
import LoadingSkeleton from "../../components/customer/ui/LoadingSkeleton";
import "../../assets/css/member/ticket.css";

function Ticket({ embedded = false }) {
    const [tickets, setTickets] = useState([]);
    const [status, setStatus] = useState("loading");
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let active = true;

        getTickets()
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
        <section
            className="customer-ticket-page"
            aria-labelledby={embedded ? undefined : "member-ticket-title"}
            aria-label={embedded ? "Danh sách giá vé" : undefined}
        >
            {!embedded && (
                <header className="customer-ticket-page__header">
                    <div>
                        <span>Khám phá thực đơn</span>
                        <h1 id="member-ticket-title">Giá vé Buffet</h1>
                        <p>Tham khảo các loại vé đang được áp dụng tại Buffet VIP.</p>
                    </div>
                    {status === "success" && (
                        <strong className="customer-ticket-page__count">{tickets.length} loại vé</strong>
                    )}
                </header>
            )}

            {embedded && status === "success" && (
                <div className="customer-ticket-page__embedded-meta" role="status">
                    {tickets.length} loại vé đang áp dụng
                </div>
            )}

            {status === "loading" && (
                <div className="customer-ticket-page__grid" aria-label="Đang tải danh sách vé">
                    {[1, 2, 3].map((item) => (
                        <div className="customer-ticket-page__skeleton" key={item}>
                            <LoadingSkeleton lines={5} />
                        </div>
                    ))}
                </div>
            )}

            {status === "error" && (
                <ErrorState
                    title="Không thể tải danh sách vé"
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
                    title="Chưa có loại vé đang áp dụng"
                    description="Danh sách sẽ được cập nhật khi hệ thống có loại vé mới."
                />
            )}

            {status === "success" && tickets.length > 0 && (
                <div className="customer-ticket-page__grid">
                    {tickets.map((ticket) => (
                        <TicketCard ticket={ticket} key={ticket.MaLoaiVe} />
                    ))}
                </div>
            )}
        </section>
    );
}

export default Ticket;
