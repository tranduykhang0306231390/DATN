import { useEffect, useState } from "react";
import { getHotTickets } from "../../api/authApi";
import TicketHotCard from "./TicketHotCard";
function TicketHot() {

    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {

        try {

            const res = await getHotTickets();

            setTickets(res.data.data || []);

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <section className="home-section">

            <div className="section-header d-flex justify-content-between align-items-center mb-3">

                <h2 className="section-title">
                    Vé nổi bật
                </h2>

            </div>

            <div className="row">

                {

                    tickets.map(ticket => (

                        <div
                            className="col-md-6 mb-3"
                            key={ticket.MaLoaiVe}
                        >

                            <TicketHotCard
                                ticket={ticket}
                            />

                        </div>

                    ))

                }

            </div>

        </section>

    );

}

export default TicketHot;