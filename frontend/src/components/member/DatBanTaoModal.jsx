import { useEffect, useState } from "react";
import { FaCalendarCheck, FaExclamationTriangle } from "react-icons/fa";
import CustomerModal from "../customer/ui/CustomerModal";
import { formatMemberNumber } from "../../utils/memberRank";
import datBanApi from "../../api/datBanApi";

const fmtMoney = (value) => (
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value) || 0)
);

const todayIso = () => new Date().toISOString().slice(0, 10);

function DatBanTaoModal({ open, onClose, onCreated }) {
    const [ngay, setNgay] = useState(todayIso());
    const [gio, setGio] = useState("11:30");
    const [soKhach, setSoKhach] = useState(2);
    const [ghiChu, setGhiChu] = useState("");

    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        if (!open) return undefined;

        setPreview(null);
        setPreviewError("");

        if (!ngay || !gio || !soKhach) return undefined;

        let active = true;
        setPreviewLoading(true);

        const timeoutId = window.setTimeout(() => {
            datBanApi
                .khungGioTrong({ ngay, gio, so_khach: soKhach })
                .then((res) => {
                    if (!active) return;
                    if (res.data?.success) setPreview(res.data.data);
                })
                .catch((err) => {
                    if (!active) return;
                    setPreviewError(err.response?.data?.message || "Không kiểm tra được khung giờ này.");
                })
                .finally(() => {
                    if (active) setPreviewLoading(false);
                });
        }, 350);

        return () => {
            active = false;
            window.clearTimeout(timeoutId);
        };
    }, [open, ngay, gio, soKhach]);

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError("");

        try {
            const res = await datBanApi.create({
                ngay,
                gio,
                so_khach: Number(soKhach),
                ghi_chu: ghiChu.trim() || undefined,
            });

            const paymentUrl = res.data?.payment_url;

            if (paymentUrl) {
                onCreated?.();
                window.location.href = paymentUrl;
                return;
            }

            onCreated?.();
            onClose?.();
        } catch (err) {
            setSubmitError(err.response?.data?.message || "Không thể tạo lượt đặt bàn. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = Boolean(preview?.ConTrong) && !previewLoading && !submitting;

    return (
        <CustomerModal
            open={open}
            onClose={submitting ? undefined : onClose}
            busy={submitting}
            closeOnBackdrop={!submitting}
            eyebrow="Giữ chỗ trước"
            title="Đặt bàn mới"
            titleId="dat-ban-tao-title"
            footer={
                <>
                    <button
                        type="button"
                        className="customer-button customer-button--secondary"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="customer-button customer-button--primary"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {submitting ? "Đang chuyển đến thanh toán…" : "Đặt bàn & thanh toán cọc"}
                    </button>
                </>
            }
        >
            <div className="customer-form-field">
                <label className="customer-form-field__label" htmlFor="dat-ban-ngay">Ngày đến</label>
                <input
                    id="dat-ban-ngay"
                    type="date"
                    className="customer-input"
                    min={todayIso()}
                    value={ngay}
                    onChange={(e) => setNgay(e.target.value)}
                />
            </div>

            <div className="customer-form-field" style={{ marginTop: 14 }}>
                <label className="customer-form-field__label" htmlFor="dat-ban-gio">Giờ đến</label>
                <input
                    id="dat-ban-gio"
                    type="time"
                    className="customer-input"
                    value={gio}
                    onChange={(e) => setGio(e.target.value)}
                />
                <span className="customer-form-field__help">
                    Khung phục vụ: 10:00–15:59 (buổi trưa) hoặc 16:00–21:59 (buổi tối).
                </span>
            </div>

            <div className="customer-form-field" style={{ marginTop: 14 }}>
                <label className="customer-form-field__label" htmlFor="dat-ban-so-khach">Số khách</label>
                <input
                    id="dat-ban-so-khach"
                    type="number"
                    min="1"
                    max="200"
                    className="customer-input"
                    value={soKhach}
                    onChange={(e) => setSoKhach(e.target.value)}
                />
            </div>

            <div className="customer-form-field" style={{ marginTop: 14 }}>
                <label className="customer-form-field__label" htmlFor="dat-ban-ghi-chu">Ghi chú (tùy chọn)</label>
                <textarea
                    id="dat-ban-ghi-chu"
                    className="customer-textarea"
                    placeholder="VD: sinh nhật, cần ghế trẻ em…"
                    value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                />
            </div>

            <div style={{ marginTop: 18 }}>
                {previewLoading && (
                    <p className="customer-form-field__help">Đang kiểm tra khung giờ…</p>
                )}

                {!previewLoading && previewError && (
                    <p className="customer-form-field__error">
                        <FaExclamationTriangle aria-hidden="true" /> {previewError}
                    </p>
                )}

                {!previewLoading && !previewError && preview && (
                    <div
                        className="customer-surface"
                        style={{ padding: 14, display: "grid", gap: 6 }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                            <FaCalendarCheck aria-hidden="true" />
                            {preview.ConTrong ? "Còn chỗ trống" : "Hết chỗ khung giờ này"}
                        </div>
                        <span className="customer-form-field__help">
                            Sức chứa còn lại: {formatMemberNumber(preview.SucChuaConLai)} khách
                        </span>
                        <span className="customer-form-field__help">
                            Cọc giữ chỗ dự kiến: <strong>{fmtMoney(preview.TienCocDuKien)}</strong>
                        </span>
                    </div>
                )}

                {submitError && (
                    <p className="customer-form-field__error" style={{ marginTop: 10 }}>
                        <FaExclamationTriangle aria-hidden="true" /> {submitError}
                    </p>
                )}
            </div>
        </CustomerModal>
    );
}

export default DatBanTaoModal;
