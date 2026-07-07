import "../../assets/css/member/ticket.css";

function TicketCard({ ticket }) {

    return (

        <div className="vip-ticket">

            <div className="ticket-watermark">
                BUFFET VIP
            </div>

            <div className="ticket-header">

                <span className="ticket-brand">

                    BUFFET VIP

                </span>

                <span className="ticket-session">

                    {ticket.BuoiAn === "Trua" ? "☀ Buổi trưa" : "🌙 Buổi tối"}

                </span>

            </div>

            <h3 className="ticket-name">

                {ticket.TenLoaiVe}

            </h3>

            <div className="ticket-detail">

                <span>

                    {ticket.LoaiNgay}

                </span>

                <span>

                    Vé Buffet

                </span>

            </div>

            <div className="ticket-bottom">

                <div className="ticket-price">

                    {Number(ticket.GiaVe).toLocaleString("vi-VN")}đ

                </div>

                
            </div>

        </div>

    );

}

export default TicketCard;