import { useCallback, useEffect, useState } from "react";
import { FaCalendarPlus, FaExclamationTriangle, FaRegCalendarTimes } from "react-icons/fa";
import Swal from "sweetalert2";

import EmptyState from "../customer/ui/EmptyState";
import ErrorState from "../customer/ui/ErrorState";
import LoadingSkeleton from "../customer/ui/LoadingSkeleton";
import Pagination from "../customer/ui/Pagination";
import StatusBadge from "../customer/ui/StatusBadge";
import DatBanTaoModal from "./DatBanTaoModal";
import datBanApi from "../../api/datBanApi";
import { formatMemberDateTime, formatMemberNumber } from "../../utils/memberRank";

import "../../assets/css/customer/account-transactions.css";

const TRANG_THAI_CONFIG = {
    ChoThanhToanCoc: { label: "Chờ thanh toán cọc", tone: "warning" },
    ChoXacNhan: { label: "Chờ xác nhận", tone: "warning" },
    DaXacNhan: { label: "Đã xác nhận", tone: "info" },
    TuChoi: { label: "Đã từ chối", tone: "danger" },
    DaNhanBan: { label: "Đã nhận bàn", tone: "success" },
    KhongDen: { label: "Không đến", tone: "danger" },
    DaHuy: { label: "Đã hủy", tone: "neutral" },
    HoanTat: { label: "Hoàn tất", tone: "success" },
};

const CO_THE_HUY = ["ChoThanhToanCoc", "ChoXacNhan", "DaXacNhan"];

const NGAN_HANG_VN = [
    "Vietcombank",
    "VietinBank",
    "BIDV",
    "Agribank",
    "Techcombank",
    "MB Bank",
    "ACB",
    "VPBank",
    "Sacombank",
    "TPBank",
];

const fmtMoney = (value) => (
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value) || 0)
);

function DatBanPanel() {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [resumingMa, setResumingMa] = useState(null);

    const loadList = useCallback(() => {
        setLoading(true);
        setError(null);

        datBanApi
            .getAll({ page, per_page: 10 })
            .then((res) => {
                if (!res.data?.success) return;
                setItems(res.data.data);
                setTotalPages(res.data.pagination?.last_page ?? 1);
            })
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, [page]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const handleTiepTucThanhToan = async (datBan) => {
        setResumingMa(datBan.MaDatBan);

        try {
            const res = await datBanApi.tiepTucThanhToan(datBan.MaDatBan);

            if (res.data?.payment_url) {
                window.location.href = res.data.payment_url;
                return;
            }
        } catch (err) {
            Swal.fire(
                "Không thể tiếp tục thanh toán",
                err.response?.data?.message || "Vui lòng thử lại hoặc hủy lượt đặt này để đặt lại.",
                "error",
            );
            loadList();
        } finally {
            setResumingMa(null);
        }
    };

    const handleHuy = async (datBan) => {
        let preview = null;

        try {
            const res = await datBanApi.getOne(datBan.MaDatBan);
            preview = res.data?.hoan_coc_neu_huy_ngay ?? null;
        } catch {
            Swal.fire("Lỗi", "Không thể kiểm tra thông tin hoàn cọc lúc này.", "error");
            return;
        }

        const canHoan = preview?.TrangThaiHoanTien === "ChoXuLy" && Number(preview?.SoTienHoan) > 0;

        let payload = {};

        if (canHoan) {
            const { value, isConfirmed } = await Swal.fire({
                title: `Hủy lượt đặt bàn ${datBan.MaDatBan}?`,
                html: `
                    <p style="margin:0 0 12px;text-align:left;color:#374151;font-size:14px;">
                        Bạn sẽ được hoàn <b>${fmtMoney(preview.SoTienHoan)}</b> trong vòng 24 giờ qua tài khoản bên dưới.
                    </p>
                    <select id="swal-ngan-hang" class="swal2-input">
                        <option value="">— Chọn ngân hàng —</option>
                        ${NGAN_HANG_VN.map((tenNganHang) => `<option value="${tenNganHang}">${tenNganHang}</option>`).join("")}
                    </select>
                    <input id="swal-so-tk" class="swal2-input" placeholder="Số tài khoản">
                    <input id="swal-ten-ctk" class="swal2-input" placeholder="Tên chủ tài khoản">
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Hủy lượt đặt",
                cancelButtonText: "Đóng",
                confirmButtonColor: "#c0472b",
                focusConfirm: false,
                preConfirm: () => {
                    const nganHang = document.getElementById("swal-ngan-hang").value.trim();
                    const soTaiKhoan = document.getElementById("swal-so-tk").value.trim();
                    const tenChuTaiKhoan = document.getElementById("swal-ten-ctk").value.trim();

                    if (!nganHang || !soTaiKhoan || !tenChuTaiKhoan) {
                        Swal.showValidationMessage("Vui lòng nhập đầy đủ thông tin ngân hàng để nhận hoàn cọc.");
                        return false;
                    }

                    return { ngan_hang: nganHang, so_tai_khoan: soTaiKhoan, ten_chu_tai_khoan: tenChuTaiKhoan };
                },
            });

            if (!isConfirmed) return;
            payload = value;
        } else {
            const confirm = await Swal.fire({
                title: `Hủy lượt đặt bàn ${datBan.MaDatBan}?`,
                text: "Hủy vào lúc này bạn sẽ không được hoàn cọc.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Hủy lượt đặt",
                cancelButtonText: "Đóng",
                confirmButtonColor: "#c0472b",
            });

            if (!confirm.isConfirmed) return;
        }

        try {
            await datBanApi.huy(datBan.MaDatBan, payload);
            await Swal.fire({
                icon: "success",
                title: "Đã hủy lượt đặt bàn",
                timer: 1600,
                showConfirmButton: false,
            });
            loadList();
        } catch (err) {
            Swal.fire("Lỗi", err.response?.data?.message || "Không thể hủy lượt đặt bàn.", "error");
        }
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 18,
                }}
            >
                <p className="customer-form-field__help" style={{ margin: 0 }}>
                    Mỗi tài khoản chỉ giữ được một lượt đặt bàn đang hoạt động tại một thời điểm.
                </p>
                <button
                    type="button"
                    className="customer-button customer-button--primary"
                    onClick={() => setCreateOpen(true)}
                >
                    <FaCalendarPlus aria-hidden="true" />
                    Đặt bàn mới
                </button>
            </div>

            {loading ? (
                <LoadingSkeleton lines={5} ariaLabel="Đang tải danh sách đặt bàn" />
            ) : error ? (
                <ErrorState
                    title="Không thể tải danh sách đặt bàn"
                    description="Dữ liệu chưa thể tải lúc này. Bạn có thể thử lại."
                    icon={<FaExclamationTriangle />}
                    onRetry={loadList}
                />
            ) : items.length === 0 ? (
                <EmptyState
                    title="Chưa có lượt đặt bàn nào"
                    description="Đặt bàn trước để giữ chỗ cho lần ghé thăm tiếp theo của bạn."
                    icon={<FaRegCalendarTimes />}
                    as="h3"
                />
            ) : (
                <>
                    <div className="transaction-table-wrap transaction-table-wrap--desktop">
                        <table className="transaction-table">
                            <caption className="customer-visually-hidden">Danh sách lượt đặt bàn</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Mã đặt bàn</th>
                                    <th scope="col">Giờ đến</th>
                                    <th scope="col">Số khách</th>
                                    <th scope="col">Bàn</th>
                                    <th scope="col">Cọc</th>
                                    <th scope="col">Trạng thái</th>
                                    <th scope="col"><span className="customer-visually-hidden">Thao tác</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const cfg = TRANG_THAI_CONFIG[item.TrangThai] ?? { label: item.TrangThai, tone: "neutral" };

                                    return (
                                        <tr key={item.MaDatBan}>
                                            <td data-label="Mã đặt bàn"><strong>{item.MaDatBan}</strong></td>
                                            <td data-label="Giờ đến">{formatMemberDateTime(item.ThoiGianDat)}</td>
                                            <td data-label="Số khách">{formatMemberNumber(item.SoLuongKhach)}</td>
                                            <td data-label="Bàn">{item.ban_an?.TenBan ?? "—"}</td>
                                            <td data-label="Cọc" className="transaction-money">{fmtMoney(item.SoTienCoc)}</td>
                                            <td data-label="Trạng thái"><StatusBadge tone={cfg.tone}>{cfg.label}</StatusBadge></td>
                                            <td className="transaction-table__action" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                {item.TrangThai === "ChoThanhToanCoc" && (
                                                    <button
                                                        type="button"
                                                        className="customer-button customer-button--primary transaction-detail-button"
                                                        onClick={() => handleTiepTucThanhToan(item)}
                                                        disabled={resumingMa === item.MaDatBan}
                                                    >
                                                        {resumingMa === item.MaDatBan ? "Đang chuyển…" : "Tiếp tục thanh toán"}
                                                    </button>
                                                )}
                                                {CO_THE_HUY.includes(item.TrangThai) && (
                                                    <button
                                                        type="button"
                                                        className="customer-button customer-button--secondary transaction-detail-button"
                                                        onClick={() => handleHuy(item)}
                                                    >
                                                        Hủy
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <ul className="transaction-mobile-list" aria-label="Danh sách lượt đặt bàn">
                        {items.map((item) => {
                            const cfg = TRANG_THAI_CONFIG[item.TrangThai] ?? { label: item.TrangThai, tone: "neutral" };

                            return (
                                <li key={item.MaDatBan} className="transaction-mobile-card">
                                    <div className="transaction-mobile-card__header">
                                        <div>
                                            <span>Mã đặt bàn</span>
                                            <strong>{item.MaDatBan}</strong>
                                        </div>
                                        <StatusBadge tone={cfg.tone}>{cfg.label}</StatusBadge>
                                    </div>
                                    <dl className="transaction-mobile-card__details">
                                        <div><dt>Giờ đến</dt><dd>{formatMemberDateTime(item.ThoiGianDat)}</dd></div>
                                        <div><dt>Số khách</dt><dd>{formatMemberNumber(item.SoLuongKhach)}</dd></div>
                                        <div><dt>Bàn</dt><dd>{item.ban_an?.TenBan ?? "—"}</dd></div>
                                        <div><dt>Cọc</dt><dd>{fmtMoney(item.SoTienCoc)}</dd></div>
                                    </dl>
                                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                        {item.TrangThai === "ChoThanhToanCoc" && (
                                            <button
                                                type="button"
                                                className="customer-button customer-button--primary transaction-detail-button"
                                                onClick={() => handleTiepTucThanhToan(item)}
                                                disabled={resumingMa === item.MaDatBan}
                                            >
                                                {resumingMa === item.MaDatBan ? "Đang chuyển…" : "Tiếp tục thanh toán"}
                                            </button>
                                        )}
                                        {CO_THE_HUY.includes(item.TrangThai) && (
                                            <button
                                                type="button"
                                                className="customer-button customer-button--secondary transaction-detail-button"
                                                onClick={() => handleHuy(item)}
                                            >
                                                Hủy lượt đặt
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="transaction-pagination-wrap">
                        <span />
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            disabled={loading}
                            ariaLabel="Phân trang đặt bàn"
                        />
                    </div>
                </>
            )}

            <DatBanTaoModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={loadList}
            />
        </div>
    );
}

export default DatBanPanel;
