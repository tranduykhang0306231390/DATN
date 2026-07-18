import { useEffect, useMemo, useState } from "react";
import {
    FaCheckCircle,
    FaCommentDots,
    FaExclamationTriangle,
    FaReceipt,
    FaTag,
    FaTicketAlt,
    FaUser,
} from "react-icons/fa";

import { getInvoiceFeedback } from "../../api/authApi";
import CustomerModal from "../../components/customer/ui/CustomerModal";
import LoadingSkeleton from "../../components/customer/ui/LoadingSkeleton";
import StatusBadge from "../../components/customer/ui/StatusBadge";
import FeedbackModal from "../../components/member/FeedbackModal";
import { calculateInvoiceTotals, toInvoiceNumber } from "../../utils/invoice";
import {
    formatMemberDateTime,
    formatMemberMoney,
    formatMemberNumber,
} from "../../utils/memberRank";
import { formatVoucherValue, getVoucherTypeLabel } from "../../utils/voucher";
import "../../assets/css/customer/account-invoice-detail.css";

const getInvoiceStatus = (status) => {
    if (status === "DaThanhToan") return { label: "Đã thanh toán", tone: "success" };
    if (status === "ChuaThanhToan") return { label: "Chờ thanh toán", tone: "warning" };
    return { label: status || "Chưa xác định", tone: "neutral" };
};

function InvoiceDetailModal({ show, onClose, invoice }) {
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [feedbackError, setFeedbackError] = useState(null);
    const [feedbackSuccess, setFeedbackSuccess] = useState("");
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [feedbackReloadKey, setFeedbackReloadKey] = useState(0);
    const invoiceId = invoice?.MaHoaDon;

    useEffect(() => {
        if (!show || !invoiceId) return undefined;
        let active = true;

        const fetchFeedback = async () => {
            await Promise.resolve();
            if (!active) return;

            setLoadingFeedback(true);
            setFeedbackError(null);
            setFeedback(null);

            try {
                const response = await getInvoiceFeedback(invoiceId);
                if (active) setFeedback(response.data?.data || null);
            } catch (error) {
                if (active) setFeedbackError(error);
            } finally {
                if (active) setLoadingFeedback(false);
            }
        };

        void fetchFeedback();
        return () => {
            active = false;
        };
    }, [feedbackReloadKey, invoiceId, show]);

    const invoiceData = useMemo(() => {
        if (!invoice) return null;

        const totals = calculateInvoiceTotals(invoice);
        const responseVouchers = invoice.vouchers_ap_dung;
        const legacyVoucher = invoice.voucherKhachHang || invoice.voucher_khach_hang;
        const vouchers = Array.isArray(responseVouchers)
            ? responseVouchers
            : (legacyVoucher ? [legacyVoucher] : []);

        return {
            ...totals,
            vouchers,
            staff: invoice.nhanVien || invoice.nhan_vien || null,
        };
    }, [invoice]);

    if (!invoice || !invoiceData) return null;

    const status = getInvoiceStatus(invoice.TrangThai);
    const rating = Math.max(0, Math.min(5, Math.trunc(toInvoiceNumber(feedback?.DiemDanhGia))));
    const canReview = invoice.TrangThai === "DaThanhToan";

    const handleClose = () => {
        if (showFeedback) return;
        onClose?.();
    };

    const handleFeedbackClose = (result) => {
        setShowFeedback(false);
        if (result?.success) {
            setFeedbackSuccess(result.message || "Đã gửi đánh giá thành công.");
            setFeedbackReloadKey((current) => current + 1);
        }
    };

    const footer = (
        <div className="invoice-detail-footer">
            <div className="invoice-detail-footer__status">
                {feedback ? (
                    <span className="is-reviewed"><FaCheckCircle aria-hidden="true" /> Đã đánh giá</span>
                ) : (
                    <span>{canReview ? "Bạn có thể chia sẻ trải nghiệm của mình." : "Chỉ hóa đơn đã thanh toán mới có thể đánh giá."}</span>
                )}
            </div>
            <div className="invoice-detail-footer__actions">
                {!feedback && canReview && (
                    <button
                        type="button"
                        className="customer-button customer-button--secondary"
                        onClick={() => {
                            setFeedbackSuccess("");
                            setShowFeedback(true);
                        }}
                        disabled={loadingFeedback || Boolean(feedbackError)}
                    >
                        <FaCommentDots aria-hidden="true" />
                        Đánh giá
                    </button>
                )}
                <button type="button" className="customer-button customer-button--primary" onClick={handleClose}>
                    Đóng
                </button>
            </div>
        </div>
    );

    return (
        <>
            <CustomerModal
                open={show}
                onClose={handleClose}
                title={`Hóa đơn ${invoice.MaHoaDon || ""}`.trim()}
                eyebrow="Chi tiết giao dịch"
                footer={footer}
                busy={showFeedback}
                className="invoice-detail-dialog"
                titleId="invoice-detail-title"
            >
                <div className="invoice-detail">
                    <section className="invoice-detail-hero" aria-label="Tổng quan hóa đơn">
                        <div className="invoice-detail-hero__icon" aria-hidden="true"><FaReceipt /></div>
                        <div className="invoice-detail-hero__content">
                            <span>Tổng thanh toán</span>
                            <strong>{formatMemberMoney(invoiceData.finalTotal, "0 ₫")}</strong>
                            <small>{formatMemberDateTime(invoice.NgayLap)}</small>
                        </div>
                        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </section>

                    <section className="invoice-detail-section" aria-labelledby="invoice-information-title">
                        <div className="invoice-detail-section__heading">
                            <FaUser aria-hidden="true" />
                            <h3 id="invoice-information-title">Thông tin giao dịch</h3>
                        </div>
                        <dl className="invoice-detail-info-grid">
                            <div><dt>Mã hóa đơn</dt><dd>{invoice.MaHoaDon || "—"}</dd></div>
                            <div><dt>Mã khách hàng</dt><dd>{invoice.MaKhachHang || "—"}</dd></div>
                            <div>
                                <dt>Nhân viên</dt>
                                <dd>{invoiceData.staff?.HoTen || invoiceData.staff?.TenNhanVien || invoice.MaNhanVien || "—"}</dd>
                            </div>
                            <div><dt>Số bàn</dt><dd>{invoice.SoBan || "—"}</dd></div>
                            <div><dt>Điểm tích lũy</dt><dd>+{formatMemberNumber(Math.max(0, toInvoiceNumber(invoice.DiemTichLuy)), "0")}</dd></div>
                            <div><dt>Điểm sử dụng</dt><dd>{formatMemberNumber(Math.max(0, toInvoiceNumber(invoice.DiemSuDung)), "0")}</dd></div>
                        </dl>
                    </section>

                    <section className="invoice-detail-section" aria-labelledby="invoice-ticket-title">
                        <div className="invoice-detail-section__heading">
                            <FaTicketAlt aria-hidden="true" />
                            <h3 id="invoice-ticket-title">Danh sách vé</h3>
                        </div>

                        {invoiceData.details.length > 0 ? (
                            <>
                                <div className="invoice-detail-ticket-table-wrap">
                                    <table className="invoice-detail-ticket-table">
                                        <caption className="customer-visually-hidden">Các loại vé trong hóa đơn</caption>
                                        <thead>
                                            <tr>
                                                <th scope="col">Loại vé</th>
                                                <th scope="col">Số lượng</th>
                                                <th scope="col">Đơn giá</th>
                                                <th scope="col">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceData.details.map((item, index) => {
                                                const quantity = Math.max(0, toInvoiceNumber(item.SoLuong));
                                                const unitPrice = Math.max(0, toInvoiceNumber(item.DonGia));
                                                return (
                                                    <tr key={item.MaChiTietHD || `${item.MaLoaiVe || "ticket"}-${index}`}>
                                                        <td>{item.loaiVe?.TenLoaiVe || item.loai_ve?.TenLoaiVe || item.MaLoaiVe || "Loại vé"}</td>
                                                        <td>{formatMemberNumber(quantity, "0")}</td>
                                                        <td>{formatMemberMoney(unitPrice, "0 ₫")}</td>
                                                        <td>{formatMemberMoney(quantity * unitPrice, "0 ₫")}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <ul className="invoice-detail-ticket-cards" aria-label="Các loại vé trong hóa đơn">
                                    {invoiceData.details.map((item, index) => {
                                        const quantity = Math.max(0, toInvoiceNumber(item.SoLuong));
                                        const unitPrice = Math.max(0, toInvoiceNumber(item.DonGia));
                                        return (
                                            <li key={item.MaChiTietHD || `${item.MaLoaiVe || "ticket-mobile"}-${index}`}>
                                                <strong>{item.loaiVe?.TenLoaiVe || item.loai_ve?.TenLoaiVe || item.MaLoaiVe || "Loại vé"}</strong>
                                                <span>{formatMemberNumber(quantity, "0")} × {formatMemberMoney(unitPrice, "0 ₫")}</span>
                                                <b>{formatMemberMoney(quantity * unitPrice, "0 ₫")}</b>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        ) : (
                            <p className="invoice-detail-empty">Hóa đơn chưa có dữ liệu chi tiết vé.</p>
                        )}
                    </section>

                    <section className="invoice-detail-section" aria-labelledby="invoice-voucher-title">
                        <div className="invoice-detail-section__heading">
                            <FaTag aria-hidden="true" />
                            <h3 id="invoice-voucher-title">Voucher áp dụng</h3>
                        </div>

                        {invoiceData.vouchers.length > 0 ? (
                            <ul className="invoice-detail-vouchers">
                                {invoiceData.vouchers.map((voucher, index) => {
                                    const offer = voucher.uuDai || voucher.uu_dai || null;
                                    return (
                                        <li key={voucher.MaVoucherKhachHang || `${offer?.MaUuDai || "voucher"}-${index}`}>
                                            <div>
                                                <strong>{offer?.TenUuDai || voucher.MaVoucherKhachHang || "Voucher thành viên"}</strong>
                                                <span>{getVoucherTypeLabel(voucher)}</span>
                                                {offer?.MoTa && <p>{offer.MoTa}</p>}
                                            </div>
                                            <b>{formatVoucherValue(voucher)}</b>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="invoice-detail-empty">Hóa đơn này không sử dụng voucher.</p>
                        )}
                    </section>

                    <section className="invoice-detail-section invoice-detail-payment" aria-labelledby="invoice-payment-title">
                        <div className="invoice-detail-section__heading">
                            <FaReceipt aria-hidden="true" />
                            <h3 id="invoice-payment-title">Tổng kết thanh toán</h3>
                        </div>
                        <dl>
                            <div><dt>Tạm tính</dt><dd>{formatMemberMoney(invoiceData.subtotal, "0 ₫")}</dd></div>
                            <div className="is-discount"><dt>Tổng ưu đãi</dt><dd>− {formatMemberMoney(invoiceData.discount, "0 ₫")}</dd></div>
                            <div className="is-total"><dt>Tổng thanh toán cuối</dt><dd>{formatMemberMoney(invoiceData.finalTotal, "0 ₫")}</dd></div>
                        </dl>
                    </section>

                    <section className="invoice-detail-section" aria-labelledby="invoice-feedback-title">
                        <div className="invoice-detail-section__heading">
                            <FaCommentDots aria-hidden="true" />
                            <h3 id="invoice-feedback-title">Đánh giá của bạn</h3>
                        </div>

                        {feedbackSuccess && (
                            <div className="invoice-detail-feedback-success" role="status" aria-live="polite">
                                <FaCheckCircle aria-hidden="true" /> {feedbackSuccess}
                            </div>
                        )}

                        {loadingFeedback ? (
                            <LoadingSkeleton lines={3} ariaLabel="Đang tải đánh giá hóa đơn" />
                        ) : feedbackError ? (
                            <div className="invoice-detail-feedback-error" role="alert">
                                <FaExclamationTriangle aria-hidden="true" />
                                <span>Không thể kiểm tra đánh giá lúc này.</span>
                                <button type="button" onClick={() => setFeedbackReloadKey((current) => current + 1)}>
                                    Thử lại
                                </button>
                            </div>
                        ) : feedback ? (
                            <div className="invoice-detail-feedback">
                                <div className="invoice-detail-feedback__rating" aria-label={`${rating} trên 5 sao`}>
                                    <span aria-hidden="true">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
                                    <strong>{rating}/5</strong>
                                </div>
                                <p>{feedback.NoiDungCuaKhachHang || "Không có nội dung đánh giá."}</p>
                                <StatusBadge tone={feedback.TrangThaiXuLy === "DaXuLy" ? "success" : "warning"}>
                                    {feedback.TrangThaiXuLy === "DaXuLy" ? "Đã phản hồi" : "Đang chờ phản hồi"}
                                </StatusBadge>
                                {feedback.TrangThaiXuLy === "DaXuLy" && feedback.NoiDungPhanHoiCuaHang && (
                                    <blockquote>
                                        <strong>Phản hồi từ cửa hàng</strong>
                                        <p>{feedback.NoiDungPhanHoiCuaHang}</p>
                                        {feedback.ThoiGianPhanHoi && <small>{formatMemberDateTime(feedback.ThoiGianPhanHoi)}</small>}
                                    </blockquote>
                                )}
                            </div>
                        ) : (
                            <p className="invoice-detail-empty">Bạn chưa đánh giá hóa đơn này.</p>
                        )}
                    </section>
                </div>
            </CustomerModal>

            <FeedbackModal
                key={invoice.MaHoaDon}
                show={showFeedback}
                onClose={handleFeedbackClose}
                invoice={invoice}
            />
        </>
    );
}

export default InvoiceDetailModal;
