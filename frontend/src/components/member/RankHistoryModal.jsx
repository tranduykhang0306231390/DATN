import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaArrowDown, FaArrowUp, FaHistory, FaTimes } from "react-icons/fa";
import { getRankHistory } from "../../api/authApi";
import EmptyState from "../customer/ui/EmptyState";
import ErrorState from "../customer/ui/ErrorState";
import LoadingSkeleton from "../customer/ui/LoadingSkeleton";
import StatusBadge from "../customer/ui/StatusBadge";
import {
    formatMemberDate,
    formatMemberDateTime,
    formatMemberMoney,
    formatMemberNumber,
    toFiniteNumber,
} from "../../utils/memberRank";
import MemberRankBadge from "./MemberRankBadge";

const getChangeInfo = (item) => {
    const oldLevel = toFiniteNumber(item?.hang_cu?.ThuTuHang);
    const newLevel = toFiniteNumber(item?.hang_moi?.ThuTuHang);

    if (oldLevel === null || (newLevel !== null && newLevel > oldLevel)) {
        return { label: "Thăng hạng", tone: "success", icon: FaArrowUp };
    }

    if (newLevel !== null && newLevel < oldLevel) {
        return { label: "Điều chỉnh hạng", tone: "coral", icon: FaArrowDown };
    }

    return { label: "Cập nhật hạng", tone: "info", icon: FaHistory };
};

function RankHistoryModal({ show, onClose, membership, joinedAt }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requestKey, setRequestKey] = useState(0);
    const modalRef = useRef(null);
    const closeButtonRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (!show) return undefined;

        let isMounted = true;

        getRankHistory()
            .then((response) => {
                if (!isMounted) return;
                setHistory(Array.isArray(response.data) ? response.data : []);
                setError(null);
            })
            .catch((requestError) => {
                if (isMounted) setError(requestError);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [show, requestKey]);

    useEffect(() => {
        if (!show) return undefined;

        previousFocusRef.current = document.activeElement;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }

            if (event.key !== "Tab" || !modalRef.current) return;

            const focusableElements = modalRef.current.querySelectorAll(
                'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
            );

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            previousFocusRef.current?.focus?.();
        };
    }, [show, onClose]);

    if (!show) return null;

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        setRequestKey((current) => current + 1);
    };

    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) onClose();
    };

    const currentTier = membership?.currentTier || null;
    const currentTierIndex = membership?.currentIndex ?? -1;
    const ranks = membership?.ranks || [];
    const firstActivityDate = history[0]?.ThoiGianThayDoi || joinedAt;

    return createPortal(
        <div className="customer-app customer-app--portal">
            <div className="member-rank-modal-backdrop" onMouseDown={handleOverlayClick}>
                <section
                    ref={modalRef}
                    className="member-rank-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="member-rank-history-title"
                >
                    <header className="member-rank-modal__header">
                        <div>
                            <span>Hành trình thành viên</span>
                            <h2 id="member-rank-history-title">Lịch sử thay đổi hạng</h2>
                        </div>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            className="member-rank-modal__close"
                            onClick={onClose}
                            aria-label="Đóng lịch sử hạng"
                        >
                            <FaTimes aria-hidden="true" />
                        </button>
                    </header>

                    <div className="member-rank-modal__body">
                        {currentTier && (
                            <div className="member-rank-modal__current">
                                <MemberRankBadge
                                    tier={currentTier}
                                    index={currentTierIndex}
                                    total={ranks.length}
                                />
                                <div>
                                    <small>Hạng hiện tại</small>
                                    <strong>{currentTier.TenHang}</strong>
                                    <span>Tham gia: {formatMemberDate(firstActivityDate)}</span>
                                </div>
                            </div>
                        )}

                        {loading && history.length === 0 && (
                            <div className="member-rank-modal__loading">
                                <LoadingSkeleton lines={5} ariaLabel="Đang tải lịch sử hạng" />
                            </div>
                        )}

                        {!loading && error && history.length === 0 && (
                            <ErrorState
                                title="Không thể tải lịch sử hạng"
                                description="Dữ liệu hạng hiện tại vẫn được giữ nguyên. Bạn có thể thử tải lại lịch sử."
                                onRetry={handleRetry}
                                icon={<FaHistory />}
                                as="h3"
                            />
                        )}

                        {!loading && !error && history.length === 0 && (
                            <EmptyState
                                title="Chưa có thay đổi hạng"
                                description="Lịch sử sẽ xuất hiện khi hệ thống ghi nhận một lần thay đổi hạng."
                                icon={<FaHistory />}
                                as="h3"
                            />
                        )}

                        {history.length > 0 && (
                            <>
                                {error && (
                                    <div className="member-rank-modal__notice" role="status">
                                        Không thể làm mới lịch sử. Dữ liệu gần nhất vẫn đang được hiển thị.
                                        <button type="button" onClick={handleRetry}>Thử lại</button>
                                    </div>
                                )}

                                <ol className="member-rank-history-list">
                                    {history.map((item, index) => {
                                        const changeInfo = getChangeInfo(item);
                                        const ChangeIcon = changeInfo.icon;
                                        const newRank = item.hang_moi || null;
                                        const newRankIndex = ranks.findIndex(
                                            (rank) => rank.MaHangThanhVien === newRank?.MaHangThanhVien,
                                        );

                                        return (
                                            <li key={item.MaLichSuHang || `${item.ThoiGianThayDoi}-${index}`}>
                                                <div className="member-rank-history-list__marker" aria-hidden="true">
                                                    <ChangeIcon />
                                                </div>
                                                <article>
                                                    <div className="member-rank-history-list__topline">
                                                        <StatusBadge tone={changeInfo.tone}>{changeInfo.label}</StatusBadge>
                                                        <time dateTime={item.ThoiGianThayDoi || undefined}>
                                                            {formatMemberDateTime(item.ThoiGianThayDoi)}
                                                        </time>
                                                    </div>

                                                    {newRank && (
                                                        <MemberRankBadge
                                                            tier={newRank}
                                                            index={newRankIndex >= 0 ? newRankIndex : 0}
                                                            total={ranks.length || 1}
                                                            size="small"
                                                        />
                                                    )}

                                                    {item.LyDoThayDoi && <p>{item.LyDoThayDoi}</p>}

                                                    <dl>
                                                        <div>
                                                            <dt>Điểm tại thời điểm đổi hạng</dt>
                                                            <dd>{formatMemberNumber(item.DiemTaiThoiDiemTH)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Chi tiêu tích lũy</dt>
                                                            <dd>{formatMemberMoney(item.TongChiTieuTaiThoiDiem)}</dd>
                                                        </div>
                                                    </dl>
                                                </article>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </div>,
        document.body,
    );
}

export default RankHistoryModal;
