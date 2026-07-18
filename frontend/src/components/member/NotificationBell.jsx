import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    getNotifications,
    getUnreadCount,
    readAllNotifications
} from "../../api/notificationApi";
import { formatMemberDateTime } from "../../utils/memberRank";

function NotificationBell() {

    const [notifications, setNotifications] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const openingRef = useRef(false);

    useEffect(() => {
        let isMounted = true;

        getUnreadCount()
            .then((res) => {
                const unreadCount = Number(res.data?.count);
                if (isMounted) setCount(Number.isFinite(unreadCount) ? unreadCount : 0);
            })
            .catch(() => {
                if (isMounted) setCount(0);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleOpen = async () => {
        if (openingRef.current) return;
        openingRef.current = true;
        setLoading(true);
        setError(false);

        try {
            const response = await getNotifications();
            const payload = response.data?.data;
            setNotifications(Array.isArray(payload) ? payload : []);

            if (count > 0) {
                await readAllNotifications();
                setCount(0);
            }
        } catch {
            // Không đánh dấu đã đọc nếu chưa tải được nội dung thông báo.
            setError(true);
        } finally {
            openingRef.current = false;
            setLoading(false);
        }
    };

    const getNotificationClass = (title) => {

        title = String(title || "").toLowerCase();

        if (title.includes("hạng"))
            return "rank";

        if (title.includes("điểm"))
            return "point";

        if (title.includes("voucher"))
            return "voucher";

        if (title.includes("hết hạn"))
            return "expired";

        return "normal";
    };

    const getIcon = (title) => {

        title = String(title || "").toLowerCase();

        if (title.includes("hạng"))
            return "👑";

        if (title.includes("điểm"))
            return "💎";

        if (title.includes("voucher"))
            return "🎁";

        if (title.includes("hết hạn"))
            return "⏰";

        return "📢";
    };
    return (

        <>
            <button
                type="button"
                className="notification-wrapper"
                data-bs-toggle="modal"
                data-bs-target="#notificationModal"
                onClick={handleOpen}
                aria-label={
                    count > 0
                        ? `Mở thông báo, có ${count} thông báo chưa đọc`
                        : "Mở thông báo"
                }
            >

                <i className="fa-solid fa-bell notification-icon"></i>

                {count > 0 && (

                    <span className="notification-badge">
                        {count}
                    </span>

                )}

            </button>

            {/* Modal */}

            {createPortal(
                <div className="customer-app customer-app--portal">
                    <div
                        className="modal fade customer-notification-modal"
                        id="notificationModal"
                        tabIndex="-1"
                        aria-labelledby="notificationModalTitle"
                        aria-hidden="true"
                    >

                <div className="modal-dialog modal-lg">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title" id="notificationModalTitle">
                                Thông báo
                            </h5>

                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Đóng thông báo"
                            ></button>

                        </div>

                        <div className="modal-body">

                            {loading && <p>Đang tải thông báo...</p>}

                            {!loading && error && (
                                <p className="text-danger" role="alert">
                                    Không thể tải thông báo. Vui lòng thử mở lại.
                                </p>
                            )}

                            {!loading && !error && notifications.length === 0 ? (

                                <p>Không có thông báo.</p>

                            ) : !loading && !error ? (

                                notifications.map((item) => (

                                    <div
                                        key={item.MaThongBao}
                                        className={`notification-card ${getNotificationClass(item.TieuDe)}`}
                                    >

                                        <div className="d-flex">

                                            <div className="notification-emoji">

                                                {getIcon(item.TieuDe)}

                                            </div>

                                            <div className="ms-3 flex-grow-1">

                                                <h6>{item.TieuDe}</h6>

                                                <p>{item.NoiDung}</p>

                                                <small>{formatMemberDateTime(item.ThoiGian)}</small>

                                            </div>

                                        </div>

                                    </div>

                                ))

                            ) : null}

                        </div>

                    </div>

                </div>

                    </div>
                </div>,
                document.body,
            )}

        </>

    );

}

export default NotificationBell;
