import "../../assets/css/member/InvoiceDetailModal.css";

function InvoiceDetailModal({ show, onClose, invoice }) {

    if (!show || !invoice) return null;

    const voucher =
        invoice.voucherKhachHang ||
        invoice.voucher_khach_hang;

    const uuDai =
        voucher?.uuDai ||
        voucher?.uu_dai;

    const nhanVien =
        invoice.nhanVien ||
        invoice.nhan_vien;

    const chiTiet =
        invoice.chiTietHoaDon ||
        invoice.chi_tiet_hoa_don;

    const tongTien = Number(invoice.TongTien);

    const giamGia = uuDai
        ? Number(uuDai.GiaTriGiam || 0)
        : 0;

    const thanhToan = tongTien - giamGia;

    return (

        <div
            className="modal fade show"
            style={{
                display: "block",
                background: "rgba(0,0,0,.45)"
            }}
        >

            <div className="modal-dialog modal-lg invoice-modal">

                <div className="modal-content">

                    {/* Header */}

                    <div className="invoice-header">

                        <div className="d-flex justify-content-between align-items-center">

                            <div>

                                <h4 className="mb-1">
                                    CHI TIẾT HÓA ĐƠN
                                </h4>

                                <small>
                                    Buffet VIP
                                </small>

                            </div>

                            <button
                                className="btn-close btn-close-white"
                                onClick={onClose}
                            ></button>

                        </div>

                    </div>

                    <div className="modal-body">

                        {/* Thông tin hóa đơn */}

                        <div className="invoice-info">

                            <div className="row">

                                <div className="col-md-6">

                                    <p>

                                        <strong>Mã hóa đơn</strong>

                                        <span>{invoice.MaHoaDon}</span>

                                    </p>

                                    <p>

                                        <strong>Ngày lập</strong>

                                        <span>{invoice.NgayLap}</span>

                                    </p>

                                    <p>

                                        <strong>Nhân viên</strong>

                                        <span>

                                            {nhanVien?.HoTen ||
                                                nhanVien?.TenNhanVien ||
                                                "Không xác định"}

                                        </span>

                                    </p>

                                </div>

                                <div className="col-md-6">

                                    <p>

                                        <strong>Trạng thái</strong>

                                        <span>

                                            {invoice.TrangThai}

                                        </span>

                                    </p>

                                    <p>

                                        <strong>Điểm sử dụng</strong>

                                        <span>

                                            {invoice.DiemSuDung}

                                        </span>

                                    </p>

                                    <p>

                                        <strong>Điểm tích lũy</strong>

                                        <span>

                                            {invoice.DiemTichLuy}

                                        </span>

                                    </p>

                                </div>

                            </div>

                        </div>
                        {/* Danh sách vé */}

                        <div className="invoice-section">

                            <h5 className="invoice-section-title">

                                Danh sách vé

                            </h5>

                            <table className="table invoice-table">

                                <thead>

                                    <tr>

                                        <th>Loại vé</th>

                                        <th className="text-center" width="80">

                                            SL

                                        </th>

                                        <th className="text-end" width="130">

                                            Đơn giá

                                        </th>

                                        <th className="text-end" width="150">

                                            Thành tiền

                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {

                                        chiTiet.map(item => (

                                            <tr key={item.MaChiTietHD}>

                                                <td>

                                                    {item.loaiVe?.TenLoaiVe ||
                                                        item.loai_ve?.TenLoaiVe}

                                                </td>

                                                <td className="text-center">

                                                    {item.SoLuong}

                                                </td>

                                                <td className="text-end">

                                                    {Number(item.DonGia).toLocaleString()} đ

                                                </td>

                                                <td className="text-end fw-semibold">

                                                    {(item.SoLuong * item.DonGia).toLocaleString()} đ

                                                </td>

                                            </tr>

                                        ))

                                    }

                                </tbody>

                            </table>

                        </div>

                        {/* Voucher */}

                        {

                            uuDai && (

                                <div className="voucher-box">

                                    <h5 className="invoice-section-title">

                                        Voucher áp dụng

                                    </h5>

                                    <div className="voucher-name">

                                        {uuDai.TenUuDai}

                                    </div>

                                    <div className="voucher-desc">

                                        {uuDai.MoTa}

                                    </div>

                                </div>

                            )

                        }
                        {/* Thanh toán */}

                        <div className="invoice-total">

                            <h5 className="invoice-section-title">

                                Thanh toán

                            </h5>

                            <table className="table table-borderless mb-0">

                                <tbody>

                                    <tr>

                                        <td>Tạm tính</td>

                                        <td className="text-end">

                                            {tongTien.toLocaleString()} đ

                                        </td>

                                    </tr>

                                    <tr>

                                        <td>Giảm voucher</td>

                                        <td className="text-end text-danger">

                                            - {giamGia.toLocaleString()} đ

                                        </td>

                                    </tr>

                                    <tr>

                                        <td>Điểm sử dụng</td>

                                        <td className="text-end">

                                            {invoice.DiemSuDung} điểm

                                        </td>

                                    </tr>

                                    <tr className="invoice-final">

                                        <td>

                                            <strong>TỔNG THANH TOÁN</strong>

                                        </td>

                                        <td className="text-end">

                                            <strong>

                                                {thanhToan.toLocaleString()} đ

                                            </strong>

                                        </td>

                                    </tr>

                                </tbody>

                            </table>

                        </div>

                    </div>

                    <div className="modal-footer justify-content-end">

                        <button

                            className="btn btn-success px-4"

                            onClick={onClose}

                        >

                            Đóng

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default InvoiceDetailModal;                             