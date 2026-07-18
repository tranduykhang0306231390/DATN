import { useRef, useState } from "react";
import { FaPaperPlane, FaStar } from "react-icons/fa";

import { sendInvoiceFeedback } from "../../api/authApi";
import CustomerModal from "../customer/ui/CustomerModal";

function FeedbackModal({ show, onClose, invoice }) {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const submittingRef = useRef(false);

    if (!invoice?.MaHoaDon) return null;

    const resetAndClose = () => {
        if (loading) return;
        setRating(5);
        setContent("");
        setError("");
        onClose?.();
    };

    const submit = async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;

        const normalizedContent = content.trim();
        if (!normalizedContent) {
            setError("Vui lòng nhập nội dung đánh giá.");
            return;
        }

        try {
            submittingRef.current = true;
            setLoading(true);
            setError("");

            await sendInvoiceFeedback(invoice.MaHoaDon, {
                DiemDanhGia: rating,
                NoiDungCuaKhachHang: normalizedContent,
            });

            setRating(5);
            setContent("");
            onClose?.({
                success: true,
                message: "Đánh giá đã được gửi. Cảm ơn bạn đã chia sẻ trải nghiệm.",
            });
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Không thể gửi đánh giá lúc này.");
        } finally {
            submittingRef.current = false;
            setLoading(false);
        }
    };

    const handleRatingKeyDown = (event) => {
        if (!["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) return;
        event.preventDefault();
        const direction = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : -1;
        setRating((current) => Math.min(5, Math.max(1, current + direction)));
    };

    const footer = (
        <div className="feedback-dialog__actions">
            <button
                type="button"
                className="customer-button customer-button--ghost"
                onClick={resetAndClose}
                disabled={loading}
            >
                Hủy
            </button>
            <button
                type="submit"
                form="invoice-feedback-form"
                className="customer-button customer-button--primary"
                disabled={loading}
            >
                <FaPaperPlane aria-hidden="true" />
                {loading ? "Đang gửi…" : "Gửi đánh giá"}
            </button>
        </div>
    );

    return (
        <CustomerModal
            open={show}
            onClose={resetAndClose}
            title="Đánh giá hóa đơn"
            eyebrow={invoice.MaHoaDon}
            footer={footer}
            busy={loading}
            className="feedback-dialog"
            titleId="invoice-feedback-title"
        >
            <form id="invoice-feedback-form" className="feedback-dialog__form" onSubmit={submit}>
                <fieldset className="feedback-dialog__rating">
                    <legend>Mức độ hài lòng</legend>
                    <div role="radiogroup" aria-label="Chọn số sao đánh giá" onKeyDown={handleRatingKeyDown}>
                        {[1, 2, 3, 4, 5].map((item) => (
                            <button
                                key={item}
                                type="button"
                                role="radio"
                                aria-checked={rating === item}
                                aria-label={`${item} sao`}
                                tabIndex={rating === item ? 0 : -1}
                                className={item <= rating ? "is-active" : ""}
                                onClick={() => setRating(item)}
                            >
                                <FaStar aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                    <span>{rating}/5 sao</span>
                </fieldset>

                <div className="customer-form-field">
                    <label className="customer-form-field__label" htmlFor="invoice-feedback-content">
                        Chia sẻ trải nghiệm
                    </label>
                    <textarea
                        id="invoice-feedback-content"
                        className="customer-textarea"
                        rows="5"
                        placeholder="Hãy cho chúng tôi biết điều bạn hài lòng hoặc cần cải thiện…"
                        value={content}
                        maxLength={1000}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "invoice-feedback-error" : "invoice-feedback-help"}
                        onChange={(event) => {
                            setContent(event.target.value);
                            setError("");
                        }}
                    />
                    <span id="invoice-feedback-help" className="customer-form-field__help">
                        Tối đa 1.000 ký tự · {content.length}/1.000
                    </span>
                    {error && (
                        <span id="invoice-feedback-error" className="customer-form-field__error" role="alert">
                            {error}
                        </span>
                    )}
                </div>
            </form>
        </CustomerModal>
    );
}

export default FeedbackModal;
