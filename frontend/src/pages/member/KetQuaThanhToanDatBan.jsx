import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaClock, FaExclamationTriangle } from "react-icons/fa";

import LoadingSkeleton from "../../components/customer/ui/LoadingSkeleton";
import datBanApi from "../../api/datBanApi";

import "../../assets/css/customer/account-center.css";

function KetQuaThanhToanDatBan() {
    const [searchParams] = useSearchParams();
    const maDatBan = searchParams.get("vnp_TxnRef");

    const [loading, setLoading] = useState(true);
    const [datBan, setDatBan] = useState(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (!maDatBan) {
            setLoading(false);
            return;
        }

        const coChuKyVnPay = searchParams.has("vnp_SecureHash");

        /*
         * Dự phòng cho môi trường dev/local: webhook IPN của VNPay gọi
         * server-to-server nên không tới được backend chạy ở localhost.
         * Query string trình duyệt quay về mang cùng dữ liệu đã ký như
         * IPN — gọi lại đúng endpoint xác thực chữ ký đó trước, backend
         * tự bỏ qua nếu đã được IPN xử lý trước đó (idempotent).
         */
        const xacNhanTruoc = coChuKyVnPay
            ? datBanApi.xacNhanKetQuaVnPay(window.location.search).catch(() => null)
            : Promise.resolve(null);

        xacNhanTruoc
            .finally(() => (
                datBanApi
                    .getOne(maDatBan)
                    .then((res) => {
                        if (res.data?.success) setDatBan(res.data.data);
                        else setLoadError(true);
                    })
                    .catch(() => setLoadError(true))
                    .finally(() => setLoading(false))
            ));
    }, [maDatBan, searchParams]);

    const renderContent = () => {
        if (!maDatBan) {
            return (
                <>
                    <FaExclamationTriangle aria-hidden="true" style={{ fontSize: 40, color: "var(--customer-danger)" }} />
                    <h1 style={{ marginTop: 14 }}>Thiếu thông tin đặt bàn</h1>
                    <p>Liên kết không hợp lệ. Vui lòng kiểm tra lại trong danh sách đặt bàn của bạn.</p>
                </>
            );
        }

        if (loading) {
            return <LoadingSkeleton lines={4} ariaLabel="Đang kiểm tra kết quả thanh toán" />;
        }

        if (loadError || !datBan) {
            return (
                <>
                    <FaExclamationTriangle aria-hidden="true" style={{ fontSize: 40, color: "var(--customer-danger)" }} />
                    <h1 style={{ marginTop: 14 }}>Không thể tải kết quả</h1>
                    <p>Vui lòng kiểm tra lại trạng thái trong danh sách đặt bàn của bạn.</p>
                </>
            );
        }

        if (datBan.TrangThaiCoc === "DaThanhToan") {
            return (
                <>
                    <FaCheckCircle aria-hidden="true" style={{ fontSize: 40, color: "var(--customer-green)" }} />
                    <h1 style={{ marginTop: 14 }}>Đặt cọc thành công!</h1>
                    <p>
                        Lượt đặt bàn <strong>{datBan.MaDatBan}</strong> đang chờ nhà hàng xác nhận và gán bàn.
                        Bạn sẽ nhận được thông báo ngay khi được xác nhận.
                    </p>
                </>
            );
        }

        return (
            <>
                <FaClock aria-hidden="true" style={{ fontSize: 40, color: "var(--customer-purple)" }} />
                <h1 style={{ marginTop: 14 }}>Chưa xác nhận được thanh toán</h1>
                <p>
                    Hệ thống chưa ghi nhận cọc cho lượt đặt bàn <strong>{datBan.MaDatBan}</strong>. Nếu bạn vừa
                    thanh toán thành công, vui lòng đợi ít phút rồi kiểm tra lại trong danh sách đặt bàn.
                </p>
            </>
        );
    };

    return (
        <div className="account-center-page">
            <div className="customer-shell">
                <div
                    className="customer-state"
                    style={{ maxWidth: 560, margin: "40px auto" }}
                >
                    {renderContent()}
                    <Link
                        to="/member/rank?tab=dat-ban"
                        className="customer-button customer-button--primary"
                        style={{ marginTop: 22 }}
                    >
                        Xem danh sách đặt bàn
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default KetQuaThanhToanDatBan;
