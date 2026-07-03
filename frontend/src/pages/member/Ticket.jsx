import { useEffect, useState } from "react";
import { getTickets } from "../../api/ticketApi";
import TicketCard from "../../components/member/TicketCard";

import "../../assets/css/member/ticket.css";

function Ticket() {

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {

        try {

            setLoading(true);

            const res = await getTickets();

            setTickets(res.data.data);

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (
            <div className="ticket-loading">
                Đang tải danh sách vé...
            </div>
        );

    }

    return (

        <div className="ticket-page container">

            <div className="ticket-header">

                <div>

                    <h2>🍽 Thực đơn vé Buffet</h2>

                    <p>

                        Tham khảo các loại vé đang được áp dụng tại Buffet VIP.

                    </p>

                </div>

                <div className="ticket-count">

                    {tickets.length} loại vé

                </div>

            </div>

            <div className="row g-4">

                {tickets.map((ticket) => (

                    <div
                        className="col-lg-6"
                        key={ticket.MaLoaiVe}
                    >

                        <TicketCard
                            ticket={ticket}
                        />

                    </div>

                ))}

            </div>

        </div>

    );

}

export default Ticket;