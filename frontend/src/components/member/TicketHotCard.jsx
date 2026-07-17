import "../../assets/css/tickethotcard.css";

function TicketHotCard({ ticket }) {

    const getBuoiAn = (value) => {
        switch (value) {
            case "Trua":
                return "Trưa";
            case "Toi":
                return "Tối";
            default:
                return value;
        }
    };

    const getLoaiNgay = (value) => {
        switch (value) {
            case "NgayThuong":
                return "Ngày thường";
            case "CuoiTuan":
                return "Cuối tuần";
            default:
                return value;
        }
    };

    return (

        <div className="ticket-hot-card">

            <div className="ticket-hot-header">

                <span className="badge bg-success">
                    {getBuoiAn(ticket.BuoiAn)}
                </span>

                <span className="badge bg-warning text-dark">
                    {getLoaiNgay(ticket.LoaiNgay)}
                </span>

            </div>

            <h5 className="mt-3">
                {ticket.TenLoaiVe}
            </h5>

            <div className="ticket-hot-price">
                {Number(ticket.GiaVe).toLocaleString("vi-VN")} đ
            </div>

        </div>

    );

}

export default TicketHotCard;
