import { Link } from "react-router-dom";
import "../../assets/css/tickethotcard.css";
function TicketHotCard({ ticket }) {

    return (

        <div className="ticket-hot-card">

            <div className="ticket-hot-header">

                <span className="badge bg-success">

                    {ticket.BuoiAn}

                </span>

                <span className="badge bg-warning text-dark">

                    {ticket.LoaiNgay}

                </span>

            </div>

            <h5 className="mt-3">

                {ticket.TenLoaiVe}

            </h5>

            <div className="ticket-hot-price">

                {Number(ticket.GiaVe).toLocaleString("vi-VN")} đ

            </div>

            <Link
                to="/member/ticket"
                className="btn btn-success mt-3 w-100"
            >

                Xem chi tiết

            </Link>

        </div>

    );

}

export default TicketHotCard;