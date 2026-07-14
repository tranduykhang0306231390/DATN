import { useEffect, useState } from "react";
import { getHotTickets } from "../../api/ticketApi";

function HotTicket() {
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        loadTicket();
    }, []);

    const loadTicket = async () => {
        try {
            const res = await getHotTickets();
            console.log("Response:", res);

            setTickets(res.data?.data || []);
        } catch (err) {
            console.log(err);
        }
    };

    const getBuoiAn = (buoi) => {

        switch (buoi) {

            case "Sang":
                return "Buổi sáng";

            case "Trua":
                return "Buổi trưa";

            case "Toi":
                return "Buổi tối";

            default:
                return buoi;

        }

    };

    const getLoaiNgay = (loaiNgay) => {

        switch (loaiNgay) {

            case "NgayThuong":
                return "Ngày thường";

            case "CuoiTuan":
                return "Cuối tuần";

            case "LeTet":
                return "Lễ / Tết";

            default:
                return loaiNgay;

        }

    };

    return (
        <section className="ticket-section" id="ticket">
            <div className="container">

                <span className="ticket-eyebrow">
                    Buffet Premium
                </span>

                <h2>Loại vé nổi bật</h2>

                <p className="ticket-subtitle">
                    Khám phá những loại vé buffet được khách hàng lựa chọn nhiều nhất.
                </p>

                <div className="ticket-grid">

                    {tickets.map((ticket) => (

                        <div className="ticket-card" key={ticket.MaLoaiVe}>

                            <div className="ticket-hole left"></div>
                            <div className="ticket-hole right"></div>

                            {/* Header */}
                            <div className="ticket-top">
                                <span className="ticket-type">
                                    {getBuoiAn(ticket.BuoiAn)}
                                </span>
                                <h5>{ticket.TenLoaiVe}</h5>
                            </div>

                            <div className="ticket-divider"></div>

                            {/* Nội dung */}
                            <div className="ticket-info">
                                <p>
                                    <span>Loại ngày:  </span>
                                    <strong>{getLoaiNgay(ticket.LoaiNgay)}</strong>
                                </p>
                            </div>

                            {/* Giá - nổi bật màu đỏ */}
                            <div className="ticket-price">
                                {Number(ticket.GiaVe).toLocaleString("vi-VN")}đ
                            </div>

                            {/* Footer */}
                            <div className="ticket-footer">
                                <span>Buffet VIP</span>
                            </div>

                        </div>

                    ))}

                </div>

            </div>
        </section>
    );
}

export default HotTicket;
