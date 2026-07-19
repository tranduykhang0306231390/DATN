import { useEffect, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";

import { getHotTickets } from "../../api/ticketApi";
import TicketCard from "../member/TicketCard";
import EmptyState from "../customer/ui/EmptyState";
import ErrorState from "../customer/ui/ErrorState";
import LoadingSkeleton from "../customer/ui/LoadingSkeleton";
import "../../assets/css/benefit.css";
import "../../assets/css/member/ticket.css";

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
        <section className="benefit-section" id="ticket" aria-labelledby="public-hot-ticket-title">
            <div className="container">
                <div className="benefit-header">
                    <span className="ticket-eyebrow">Buffet Premium</span>
                    <h2 id="public-hot-ticket-title">Loại vé nổi bật</h2>
                    <p>
                        Khám phá các loại vé đang được giới thiệu trong hệ thống.
                    </p>
                </div>

                {status === "loading" && (
                    <div className="customer-ticket-page__grid" aria-label="Đang tải loại vé nổi bật">
                        {[1, 2, 3].map((item) => (
                            <div className="customer-ticket-page__skeleton" key={item}>
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
                    <div className="customer-ticket-page__grid">
                        {tickets.map((ticket) => (
                            <TicketCard ticket={ticket} key={ticket.MaLoaiVe} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default HotTicket;
