import { useEffect, useState } from "react";
import {
    getNotifications,
    getUnreadCount,
    readAllNotifications
} from "../../api/notificationApi";

function NotificationBell() {

    const [notifications, setNotifications] = useState([]);
    const [count, setCount] = useState(0);

    // Load số thông báo chưa đọc
    const loadCount = async () => {
        try {
            const res = await getUnreadCount();

            setCount(res.data.count);

        } catch (err) {
            console.log(err);
        }
    };

    // Load danh sách thông báo
    const loadNotifications = async () => {

        try {

            const res = await getNotifications();

            setNotifications(res.data.data);

        } catch (err) {

            console.log(err);

        }

    };

    useEffect(() => {
        loadCount();
    }, []);

    const handleOpen = async () => {

        await loadNotifications();

        if (count > 0) {
            await readAllNotifications();
            setCount(0);
        }

    };
    const getNotificationClass = (title) => {

        title = title.toLowerCase();

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

        title = title.toLowerCase();

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
            <div
                className="notification-wrapper"
                data-bs-toggle="modal"
                data-bs-target="#notificationModal"
                onClick={handleOpen}
            >

                <i className="fa-solid fa-bell notification-icon"></i>

                {count > 0 && (

                    <span className="notification-badge">
                        {count}
                    </span>

                )}

            </div>

            {/* Modal */}

            <div
                className="modal fade"
                id="notificationModal"
                tabIndex="-1"
            >

                <div className="modal-dialog modal-lg">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title">
                                Thông báo
                            </h5>

                            <button
                                className="btn-close"
                                data-bs-dismiss="modal"
                            ></button>

                        </div>

                        <div className="modal-body">

                            {notifications.length === 0 ? (

                                <p>Không có thông báo.</p>

                            ) : (

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

                                                <small>{item.ThoiGian}</small>

                                            </div>

                                        </div>

                                    </div>

                                ))

                            )}

                        </div>

                    </div>

                </div>

            </div>

        </>

    );

}

export default NotificationBell;