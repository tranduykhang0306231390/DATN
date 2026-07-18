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

function TicketCard({ ticket }) {
    const price = Number(ticket?.GiaVe);

    return (
        <article className="customer-ticket-card">
            <div className="customer-ticket-card__watermark" aria-hidden="true">BUFFET</div>
            <div className="customer-ticket-card__top">
                <span className="customer-ticket-card__brand">Buffet</span>
                <span className="customer-ticket-card__session">{getMealLabel(ticket?.BuoiAn)}</span>
            </div>
            <h2>{ticket?.TenLoaiVe || "Loại vé"}</h2>
            <div className="customer-ticket-card__details">
                {ticket?.LoaiVe && <span>{ticket.LoaiVe}</span>}
                <span>{getDayTypeLabel(ticket?.LoaiNgay)}</span>
            </div>
            <div className="customer-ticket-card__bottom">
                {Number.isFinite(price) && price >= 0
                    ? `${price.toLocaleString("vi-VN")} ₫`
                    : "Liên hệ"}
            </div>
        </article>
    );
}

export default TicketCard;
