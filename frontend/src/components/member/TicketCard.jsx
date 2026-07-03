import "../../assets/css/member/ticket.css";

function TicketCard({ ticket }) {

    return (
        <div className="ticket-card">

            <div className="ticket-top">

                <div className="ticket-title">

                    {ticket.TenLoaiVe}

                </div>

                <div className="ticket-badge">

                    {ticket.BuoiAn === "Trua" ? "Buổi trưa" : "Buổi tối"}

                </div>

            </div>

            <div className="ticket-body">

                <div className="ticket-info">

                    <p>
                        <span>Loại ngày:</span> {ticket.LoaiNgay}
                    </p>

                </div>

                <div className="ticket-price">

                    {Number(ticket.GiaVe).toLocaleString("vi-VN")} đ

                </div>

            </div>

            <div className="ticket-footer">

                <button className="btn-view">
                    Chi tiết
                </button>

                <button className="btn-buy">
                    Mua vé
                </button>

            </div>

        </div>
    );

}

export default TicketCard;