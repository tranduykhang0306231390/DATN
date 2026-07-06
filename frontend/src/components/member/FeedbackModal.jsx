import { useState } from "react";
import Swal from "sweetalert2";
import {
    sendInvoiceFeedback
} from "../../api/authApi";

import "../../assets/css/member/FeedbackModal.css";

function FeedbackModal({
    show,
    onClose,
    invoice
}) {

    const [rating, setRating] = useState(5);

    const [content, setContent] = useState("");

    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const submit = async () => {

        if (content.trim() === "") {

            Swal.fire({
                icon: "warning",
                title: "Thông báo",
                text: "Vui lòng nhập nội dung đánh giá."
            });

            return;

        }

        try {

            setLoading(true);

            await sendInvoiceFeedback(invoice.MaHoaDon, {

                DiemDanhGia: rating,

                NoiDungCuaKhachHang: content

            });

            Swal.fire({

                icon: "success",

                title: "Thành công",

                text: "Cảm ơn bạn đã đánh giá."

            });

            onClose();

        }

      catch (err) {

    console.log("FULL ERROR:", err);
    console.log("STATUS:", err.response?.status);
    console.log("DATA:", err.response?.data);

    Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err.response?.data?.message || "Không thể gửi đánh giá."
    });
}
        finally {

            setLoading(false);

        }

    };

    return (

        <div
            className="modal fade show"
            style={{
                display: "block",
                background: "rgba(0,0,0,.45)"
            }}
        >

            <div className="modal-dialog">

                <div className="modal-content">

                    <div className="modal-header">

                        <h5>

                            Đánh giá hóa đơn

                        </h5>

                        <button
                            className="btn-close"
                            onClick={onClose}
                        ></button>

                    </div>

                    <div className="modal-body">

                        <div className="text-center mb-4">

                            {

                                [1, 2, 3, 4, 5].map(item => (

                                    <span

                                        key={item}

                                        className={
                                            item <= rating
                                                ? "feedback-star active"
                                                : "feedback-star"
                                        }

                                        onClick={() => setRating(item)}

                                    >

                                        ★

                                    </span>

                                ))

                            }

                        </div>

                        <textarea

                            rows="5"

                            className="form-control"

                            placeholder="Hãy chia sẻ trải nghiệm của bạn..."

                            value={content}

                            onChange={(e) => setContent(e.target.value)}

                        />

                    </div>

                    <div className="modal-footer">

                        <button

                            className="btn btn-secondary"

                            onClick={onClose}

                        >

                            Hủy

                        </button>

                        <button

                            className="btn btn-success"

                            disabled={loading}

                            onClick={submit}

                        >

                            {

                                loading

                                    ? "Đang gửi..."

                                    : "Gửi đánh giá"

                            }

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default FeedbackModal;