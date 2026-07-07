import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { getRankHistory } from "../../api/authApi";
import "../../assets/css/rankHistoryModal.css";

// Icon theo thứ tự hạng (ThuTuHang) lấy trực tiếp từ DB - không phụ thuộc tên hạng
// cụ thể là gì (Đồng/Bạc/Vàng/Kim cương hay Standard/Gold/VIP...)
const RANK_ICON_BY_ORDER = {
    1: "🥉",
    2: "🥈",
    3: "🥇",
    4: "💎"
};

function RankHistoryModal({ show, onClose }) {

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(false);

    // Tải lịch sử mỗi khi modal được mở
    useEffect(() => {
        if (show) {
            loadHistory();
        }
    }, [show]);

    // Khoá cuộn trang nền + cho phép nhấn ESC để đóng modal
    useEffect(() => {

        if (!show) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };

    }, [show, onClose]);

    const loadHistory = async () => {

        try {

            setLoading(true);
            setError(false);

            const res = await getRankHistory();

            setHistory(Array.isArray(res.data) ? res.data : []);

        } catch (err) {

            console.error("Lỗi tải lịch sử hạng:", err);
            setError(true);

            Swal.fire({
                icon: "error",
                title: "Không tải được lịch sử hạng",
                text: "Vui lòng thử lại sau."
            });

        } finally {
            setLoading(false);
        }

    };

    // rank là object hang_cu / hang_moi trả về từ API (chứa TenHang, ThuTuHang...)
    const getRankIcon = (rank) => {
        if (!rank) return "👤";
        return RANK_ICON_BY_ORDER[rank.ThuTuHang] || "🏅";
    };

    // So sánh cấp bậc cũ/mới (dựa vào ThuTuHang - số thứ tự hạng thật trong DB)
    // để xác định đây là thăng hạng, hạ hạng, hay chỉ cập nhật
    const getChangeInfo = (item) => {

        const oldLevel = item.hang_cu?.ThuTuHang;
        const newLevel = item.hang_moi?.ThuTuHang;

        if (oldLevel == null || newLevel == null || newLevel > oldLevel) {
            return { label: "⬆️ Thăng hạng", tone: "up" };
        }

        if (newLevel < oldLevel) {
            return { label: "⬇️ Điều chỉnh hạng", tone: "down" };
        }

        return { label: "🔄 Cập nhật hạng", tone: "same" };

    };

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("vi-VN") + "đ";

    const formatPoint = (value) =>
        Number(value || 0).toLocaleString("vi-VN");

    const formatDate = (date) => {
        if (!date) return "--";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    // Bấm ra vùng nền tối (ngoài modal) thì đóng lại
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!show) return null;

    const currentRankObj =
        history.length > 0
            ? history[history.length - 1].hang_moi
            : null;

    const currentRankName = currentRankObj?.TenHang;

    return (

        <div className="rank-history-overlay" onClick={handleOverlayClick}>

            <div className="rank-history-modal">

                {/* HEADER */}
                <div className="rank-header">

                    <div>
                        <h2>LỊCH SỬ HẠNG THÀNH VIÊN</h2>
                        <p>Hành trình trở thành thành viên Buffet VIP</p>
                    </div>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>

                </div>

                {/* HẠNG HIỆN TẠI */}
                <div className="current-rank-card">

                    <div className="current-rank-icon">
                        {getRankIcon(currentRankObj)}
                    </div>

                    <div>
                        <div className="current-rank-title">
                            Bạn hiện đang là
                        </div>
                        <h3>
                            THÀNH VIÊN {(currentRankName || "MỚI").toUpperCase()}
                        </h3>
                        <p>
                            Gia nhập ngày{" "}
                            {history.length > 0
                                ? formatDate(history[0].ThoiGianThayDoi)
                                : "--"}
                        </p>
                    </div>

                </div>

                {/* TIMELINE */}
                <div className="timeline">

                    {loading && (
                        <div className="loading-box">Đang tải...</div>
                    )}

                    {!loading && error && (
                        <div className="loading-box">
                            Không thể tải lịch sử hạng. Vui lòng thử lại.
                        </div>
                    )}

                    {!loading && !error && history.length === 0 && (
                        <div className="loading-box">
                            Chưa có lịch sử thay đổi hạng.
                        </div>
                    )}

                    {!loading && !error && history.map((item, index) => {

                        const isJoin = !item.hang_cu;
                        const isCurrent = index === history.length - 1;
                        const changeInfo = getChangeInfo(item);

                        return (

                            <div className="timeline-card" key={item.MaLichSuHang ?? index}>

                                {isJoin ? (
                                    <>
                                        <div className="timeline-title">
                                            🎉 Gia nhập Buffet VIP
                                        </div>

                                        <div className="timeline-date">
                                            {formatDate(item.ThoiGianThayDoi)}
                                        </div>

                                        <p>
                                            Bạn đã đăng ký trở thành thành viên Buffet VIP.
                                        </p>

                                        <div className="rank-box">
                                            <span>Hạng nhận được</span>
                                            <h4>
                                                {getRankIcon(item.hang_moi)}{" "}
                                                {item.hang_moi?.TenHang}
                                            </h4>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="timeline-title">
                                            {changeInfo.label}
                                        </div>

                                        <div className="timeline-date">
                                            {formatDate(item.ThoiGianThayDoi)}
                                        </div>

                                        <p>
                                            {item.LyDoThayDoi || "Không có ghi chú"}
                                        </p>

                                        <div className="rank-upgrade">
                                            <div>
                                                {getRankIcon(item.hang_cu)}
                                                <br />
                                                {item.hang_cu?.TenHang}
                                            </div>

                                            <div className={`arrow arrow-${changeInfo.tone}`}>
                                                →
                                            </div>

                                            <div>
                                                {getRankIcon(item.hang_moi)}
                                                <br />
                                                {item.hang_moi?.TenHang}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="timeline-footer">

                                    <div className="timeline-info">
                                        <div>
                                            <span>Chi tiêu tích lũy</span>
                                            <strong>
                                                {formatMoney(item.TongChiTieuTaiThoiDiem)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Điểm tích lũy</span>
                                            <strong>
                                                {formatPoint(item.DiemTaiThoiDiemTH)}
                                            </strong>
                                        </div>
                                    </div>

                                    {isCurrent && (
                                        <div className="current-badge">
                                            ✔ HẠNG HIỆN TẠI
                                        </div>
                                    )}

                                </div>

                            </div>

                        );

                    })}

                </div>

            </div>

        </div>

    );

}

export default RankHistoryModal;
