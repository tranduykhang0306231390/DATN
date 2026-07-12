import "../../assets/css/member/InvoiceDetailModal.css";
import { useState, useEffect } from "react";
import FeedbackModal from "./FeedbackModal";
import { getInvoiceFeedback } from "../../api/authApi";

function InvoiceDetailModal({ show, onClose, invoice }) {

    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    // ==============================
    // FETCH FEEDBACK FUNCTION
    // ==============================
    const fetchFeedback = async () => {
        if (!invoice?.MaHoaDon) return;

        try {
            setLoadingFeedback(true);

            const res = await getInvoiceFeedback(invoice.MaHoaDon);

            // Backend trả về: { success: true, data: <feedback object hoặc null> }
            // Sửa lại cho khớp field "data" mà backend thực sự trả về
            // (trước đây code đọc nhầm res.data?.feedback -> luôn undefined)
            setFeedback(res.data?.data || null);

        } catch (err) {
            console.log("No feedback:", err);
            setFeedback(null);
        } finally {
            setLoadingFeedback(false);
        }
    };

    // ==============================
    // LOAD WHEN OPEN MODAL
    // ==============================
    useEffect(() => {
        if (!show || !invoice?.MaHoaDon) return;

        fetchFeedback();
    }, [show, invoice]);

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
        invoice.chi_tiet_hoa_don ||
        [];

    const tongTien = Number(invoice.TongTien || 0);

    const giamGia = uuDai
        ? Number(uuDai.GiaTriGiam || 0)
        : 0;

    const thanhToan = tongTien - giamGia;

    return (
        <div
            className="modal fade show"
            style={{ display: "block", background: "rgba(0,0,0,.45)" }}
        >
            <div className="modal-dialog modal-lg invoice-modal">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="invoice-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4 className="mb-1">CHI TIẾT HÓA ĐƠN</h4>
                                <small>Buffet VIP</small>
                            </div>

                            <button
                                className="btn-close btn-close-white"
                                onClick={onClose}
                            />
                        </div>
                    </div>

                    <div className="modal-body">

                        {/* INFO */}
                        <div className="invoice-info">
                            <div className="row">
                                <div className="col-md-6">
                                    <p><strong>Mã hóa đơn</strong> <span>{invoice.MaHoaDon}</span></p>
                                    <p><strong>Ngày lập</strong> <span>{invoice.NgayLap}</span></p>
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
                                    <p><strong>Trạng thái</strong> <span>{invoice.TrangThai}</span></p>
                                    <p><strong>Điểm tích lũy</strong> <span>{invoice.DiemTichLuy}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* CHI TIẾT */}
                        <div className="invoice-section">
                            <h5>Danh sách vé</h5>

                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Loại vé</th>
                                        <th className="text-center">SL</th>
                                        <th className="text-end">Đơn giá</th>
                                        <th className="text-end">Thành tiền</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {chiTiet.map(item => (
                                        <tr key={item.MaChiTietHD}>
                                            <td>
                                                {item.loaiVe?.TenLoaiVe ||
                                                    item.loai_ve?.TenLoaiVe}
                                            </td>
                                            <td className="text-center">{item.SoLuong}</td>
                                            <td className="text-end">
                                                {Number(item.DonGia).toLocaleString()} đ
                                            </td>
                                            <td className="text-end fw-bold">
                                                {(item.SoLuong * item.DonGia).toLocaleString()} đ
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* VOUCHER */}
                        {uuDai && (
                            <div className="voucher-box">
                                <h5>Voucher áp dụng</h5>
                                <div>{uuDai.TenUuDai}</div>
                                <div>{uuDai.MoTa}</div>
                            </div>
                        )}

                        {/* THANH TOÁN */}
                        <div className="invoice-total">
                            <h5>Thanh toán</h5>

                            <table className="table table-borderless">
                                <tbody>
                                    <tr>
                                        <td>Tạm tính</td>
                                        <td className="text-end">{tongTien.toLocaleString()} đ</td>
                                    </tr>

                                    <tr>
                                        <td>Giảm voucher</td>
                                        <td className="text-end text-danger">
                                            - {giamGia.toLocaleString()} đ
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>Điểm sử dụng</td>
                                        <td className="text-end">{invoice.DiemSuDung}</td>
                                    </tr>

                                    <tr className="fw-bold">
                                        <td>TỔNG</td>
                                        <td className="text-end">
                                            {thanhToan.toLocaleString()} đ
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* FEEDBACK */}
                        {/* FEEDBACK */}
                        <div className="invoice-section">
                            <h5>Đánh giá của bạn</h5>

                            {loadingFeedback && <p>Đang tải...</p>}

                            {!loadingFeedback && feedback && (
                                <div className="feedback-box">

                                    {/* Đánh giá */}
                                    <div className="mb-3">
                                        <strong>Đánh giá của bạn</strong>

                                        <div className="mt-2">
                                            <span className="text-warning fs-5">
                                                {"★".repeat(feedback.DiemDanhGia)}
                                                {"☆".repeat(5 - feedback.DiemDanhGia)}
                                            </span>

                                            <span className="ms-2 fw-bold">
                                                {feedback.DiemDanhGia}/5
                                            </span>
                                        </div>
                                    </div>

                                    {/* Nội dung khách */}
                                    <div className="mb-3">
                                        <strong>Ý kiến của bạn</strong>

                                        <div className="border rounded p-3 mt-2 bg-light">
                                            {feedback.NoiDungCuaKhachHang}
                                        </div>
                                    </div>

                                    <hr />

                                    {/* Trạng thái */}
                                    <div className="mb-3">
                                        <strong>Trạng thái xử lý</strong>

                                        <div className="mt-2">
                                            <span
                                                className={
                                                    feedback.TrangThaiXuLy === "DaXuLy"
                                                        ? "badge bg-success"
                                                        : "badge bg-warning text-dark"
                                                }
                                            >
                                                {feedback.TrangThaiXuLy === "DaXuLy"
                                                    ? "Đã xử lý"
                                                    : "Chưa xử lý"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Phản hồi của cửa hàng */}
                                    {feedback.TrangThaiXuLy === "DaXuLy" &&
                                        feedback.NoiDungPhanHoiCuaHang && (
                                            <div className="mt-4">
                                                <strong>Phản hồi từ cửa hàng</strong>

                                                <div className="border rounded p-3 bg-white mt-2">
                                                    {feedback.NoiDungPhanHoiCuaHang}
                                                </div>

                                                {feedback.ThoiGianPhanHoi && (
                                                    <small className="text-muted d-block mt-2">
                                                        Phản hồi lúc: {feedback.ThoiGianPhanHoi}
                                                    </small>
                                                )}
                                            </div>
                                        )}
                                </div>
                            )}

                            {!loadingFeedback && !feedback && (
                                <p className="text-muted">
                                    Chưa có đánh giá
                                </p>
                            )}
                        </div>

                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer justify-content-between">

                        {!feedback ? (
                            <button
                                className="btn btn-outline-warning"
                                onClick={() => setShowFeedback(true)}
                            >
                                ⭐ Đánh giá
                            </button>
                        ) : (
                            <span className="text-success">✔ Đã đánh giá</span>
                        )}

                        <button className="btn btn-success" onClick={onClose}>
                            Đóng
                        </button>
                    </div>

                </div>
            </div>

            {!loadingFeedback && feedback && (
                <div className="feedback-box">

                    <div className="mb-2">
                        <strong>Đánh giá:</strong> ⭐ {feedback.DiemDanhGia}/5
                    </div>

                    <div className="mb-3">
                        <strong>Ý kiến của bạn:</strong>
                        <br />
                        {feedback.NoiDungCuaKhachHang}
                    </div>

                    <hr />

                    <div className="mb-2">
                        <strong>Trạng thái xử lý:</strong>{" "}
                        <span
                            className={
                                feedback.TrangThaiXuLy === "DaXuLy"
                                    ? "badge bg-success"
                                    : "badge bg-warning text-dark"
                            }
                        >
                            {feedback.TrangThaiXuLy === "DaXuLy"
                                ? "Đã xử lý"
                                : "Chưa xử lý"}
                        </span>

                    </div>

                </div>
            )}
        </div>
    );
}

export default InvoiceDetailModal;
