import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FaArrowDown,
    FaArrowUp,
    FaCoins,
    FaEye,
    FaFileInvoiceDollar,
    FaFilter,
    FaHistory,
    FaMinus,
    FaReceipt,
    FaSearch,
    FaStar,
    FaSyncAlt,
} from "react-icons/fa";

import axiosClient from "../../api/axiosClient";
import { getPointHistory } from "../../api/authApi";
import AccountNavigation from "../../components/member/AccountNavigation";
import TransactionFilterBar from "../../components/member/TransactionFilterBar";
import EmptyState from "../../components/customer/ui/EmptyState";
import ErrorState from "../../components/customer/ui/ErrorState";
import LoadingSkeleton from "../../components/customer/ui/LoadingSkeleton";
import Pagination from "../../components/customer/ui/Pagination";
import SectionHeading from "../../components/customer/ui/SectionHeading";
import StatusBadge from "../../components/customer/ui/StatusBadge";
import { getStoredCustomerUser } from "../../utils/customerSession";
import {
    formatMemberDateTime,
    formatMemberMoney,
    formatMemberNumber,
    getPointActivityDelta,
} from "../../utils/memberRank";
import InvoiceDetailModal from "./InvoiceDetailModal";
import "../../assets/css/customer/account-transactions.css";

const INVOICE_DEFAULT_FILTERS = {
    keyword: "",
    from: "",
    to: "",
    sort: "newest",
};

const POINT_DEFAULT_FILTERS = {
    keyword: "",
    type: "all",
    from: "",
    to: "",
    sort: "newest",
};

const POINT_TYPE_OPTIONS = [
    { value: "all", label: "Tất cả giao dịch" },
    { value: "CongDiemHoaDon", label: "Cộng điểm hóa đơn" },
    { value: "DoiVoucher", label: "Đổi voucher" },
    { value: "HoanDiemHuyHD", label: "Điều chỉnh hóa đơn" },
];

const POINT_SORT_OPTIONS = [
    { value: "newest", label: "Mã giao dịch mới nhất" },
    { value: "oldest", label: "Giao dịch cũ nhất" },
    { value: "point_desc", label: "Điểm cao đến thấp" },
    { value: "point_asc", label: "Điểm thấp đến cao" },
];

const getActivityLabel = (type) => {
    const labels = {
        CongDiemHoaDon: "Cộng điểm hóa đơn",
        DoiVoucher: "Đổi voucher",
        HoanDiemHuyHD: "Điều chỉnh khi hủy hóa đơn",
    };

    return labels[type] || type || "Giao dịch điểm";
};

const getInvoiceStatus = (status) => {
    const statuses = {
        DaThanhToan: { label: "Đã thanh toán", tone: "success" },
        ChuaThanhToan: { label: "Chờ thanh toán", tone: "warning" },
    };

    return statuses[status] || {
        label: status || "Chưa xác định",
        tone: "neutral",
    };
};

const getPointPresentation = (item) => {
    const delta = getPointActivityDelta(item);
    if (delta > 0) {
        return {
            delta,
            label: "Cộng điểm",
            tone: "success",
            className: "is-positive",
            icon: <FaArrowUp />,
        };
    }

    if (delta < 0) {
        return {
            delta,
            label: "Trừ điểm",
            tone: "coral",
            className: "is-negative",
            icon: <FaArrowDown />,
        };
    }

    return {
        delta: 0,
        label: "Không đổi điểm",
        tone: "neutral",
        className: "is-neutral",
        icon: <FaMinus />,
    };
};

const getHistoryErrorCopy = (error, subject) => {
    const status = error?.response?.status;

    if (status === 401) {
        return {
            title: "Phiên đăng nhập đã hết hạn",
            description: `Vui lòng đăng nhập lại để xem ${subject}.`,
            canRetry: false,
        };
    }

    if (status === 403) {
        return {
            title: "Bạn không có quyền truy cập",
            description: `Tài khoản hiện tại không thể xem ${subject}.`,
            canRetry: false,
        };
    }

    if (!error?.response) {
        return {
            title: "Không thể kết nối máy chủ",
            description: "Hãy kiểm tra kết nối mạng rồi thử lại.",
            canRetry: true,
        };
    }

    return {
        title: `Không thể tải ${subject}`,
        description: "Dữ liệu chưa thể tải lúc này. Vui lòng thử lại sau.",
        canRetry: true,
    };
};

const hasDateRangeError = (filters) => (
    Boolean(filters.from && filters.to && filters.to < filters.from)
);

function HistorySummary({ total, currentPage, totalPages, currentPoints, label, loading }) {
    return (
        <div className="transaction-summary" aria-label="Tổng quan lịch sử">
            <article className="transaction-summary__card transaction-summary__card--green">
                <span className="transaction-summary__icon" aria-hidden="true"><FaReceipt /></span>
                <div>
                    <span>{label}</span>
                    <strong>{loading && total === null ? "—" : formatMemberNumber(total ?? 0)}</strong>
                </div>
            </article>
            <article className="transaction-summary__card transaction-summary__card--purple">
                <span className="transaction-summary__icon" aria-hidden="true"><FaHistory /></span>
                <div>
                    <span>Trang đang xem</span>
                    <strong>{currentPage}/{Math.max(1, totalPages)}</strong>
                </div>
            </article>
            {currentPoints !== null && (
                <article className="transaction-summary__card transaction-summary__card--gold">
                    <span className="transaction-summary__icon" aria-hidden="true"><FaStar /></span>
                    <div>
                        <span>Điểm hiện có</span>
                        <strong>{formatMemberNumber(currentPoints)}</strong>
                    </div>
                </article>
            )}
        </div>
    );
}

function InvoiceHistoryTable({ items, detailLoadingCode, onViewDetail }) {
    return (
        <>
            <div className="transaction-table-wrap transaction-table-wrap--desktop">
                <table className="transaction-table">
                    <caption className="customer-visually-hidden">Danh sách hóa đơn của khách hàng</caption>
                    <thead>
                        <tr>
                            <th scope="col">Mã hóa đơn</th>
                            <th scope="col">Ngày giao dịch</th>
                            <th scope="col">Điểm tích lũy</th>
                            <th scope="col">Tổng thanh toán</th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col"><span className="customer-visually-hidden">Thao tác</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => {
                            const status = getInvoiceStatus(item.TrangThai);
                            const isOpening = detailLoadingCode === item.MaHoaDon;

                            return (
                                <tr key={item.MaHoaDon}>
                                    <td data-label="Mã hóa đơn"><strong>{item.MaHoaDon || "—"}</strong></td>
                                    <td data-label="Ngày giao dịch">{formatMemberDateTime(item.NgayLap)}</td>
                                    <td data-label="Điểm tích lũy">
                                        <span className="transaction-points transaction-points--positive">
                                            <FaStar aria-hidden="true" />
                                            +{formatMemberNumber(Math.max(0, Number(item.DiemTichLuy) || 0))}
                                        </span>
                                    </td>
                                    <td data-label="Tổng thanh toán" className="transaction-money">
                                        {formatMemberMoney(item.TongTien, "0 ₫")}
                                    </td>
                                    <td data-label="Trạng thái">
                                        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                                    </td>
                                    <td className="transaction-table__action">
                                        <button
                                            type="button"
                                            className="customer-button customer-button--secondary transaction-detail-button"
                                            onClick={() => onViewDetail(item.MaHoaDon)}
                                            disabled={Boolean(detailLoadingCode)}
                                        >
                                            <FaEye aria-hidden="true" />
                                            {isOpening ? "Đang mở…" : "Chi tiết"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ul className="transaction-mobile-list" aria-label="Danh sách hóa đơn">
                {items.map((item) => {
                    const status = getInvoiceStatus(item.TrangThai);
                    const isOpening = detailLoadingCode === item.MaHoaDon;

                    return (
                        <li key={item.MaHoaDon} className="transaction-mobile-card">
                            <div className="transaction-mobile-card__header">
                                <div>
                                    <span>Mã hóa đơn</span>
                                    <strong>{item.MaHoaDon || "—"}</strong>
                                </div>
                                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                            </div>
                            <dl className="transaction-mobile-card__details">
                                <div><dt>Ngày giao dịch</dt><dd>{formatMemberDateTime(item.NgayLap)}</dd></div>
                                <div><dt>Tổng thanh toán</dt><dd>{formatMemberMoney(item.TongTien, "0 ₫")}</dd></div>
                                <div>
                                    <dt>Điểm tích lũy</dt>
                                    <dd className="transaction-points transaction-points--positive">
                                        +{formatMemberNumber(Math.max(0, Number(item.DiemTichLuy) || 0))}
                                    </dd>
                                </div>
                            </dl>
                            <button
                                type="button"
                                className="customer-button customer-button--secondary transaction-detail-button"
                                onClick={() => onViewDetail(item.MaHoaDon)}
                                disabled={Boolean(detailLoadingCode)}
                            >
                                <FaEye aria-hidden="true" />
                                {isOpening ? "Đang mở…" : "Xem chi tiết"}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

function PointHistoryTable({ items, detailLoadingCode, onViewDetail }) {
    return (
        <>
            <div className="transaction-table-wrap transaction-table-wrap--desktop">
                <table className="transaction-table">
                    <caption className="customer-visually-hidden">Danh sách giao dịch tích điểm</caption>
                    <thead>
                        <tr>
                            <th scope="col">Mã giao dịch</th>
                            <th scope="col">Nội dung</th>
                            <th scope="col">Tham chiếu</th>
                            <th scope="col">Ngày giờ</th>
                            <th scope="col">Biến động điểm</th>
                            <th scope="col">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const presentation = getPointPresentation(item);
                            const canOpenInvoice = item.LoaiGiaoDich === "CongDiemHoaDon" && item.MaThamChieu;
                            const isOpening = detailLoadingCode === item.MaThamChieu;
                            const key = item.MaGiaoDichDiem || `${item.MaThamChieu || "point"}-${index}`;

                            return (
                                <tr key={key}>
                                    <td data-label="Mã giao dịch"><strong>{item.MaGiaoDichDiem || "—"}</strong></td>
                                    <td data-label="Nội dung">{getActivityLabel(item.LoaiGiaoDich)}</td>
                                    <td data-label="Tham chiếu">
                                        {canOpenInvoice ? (
                                            <button
                                                type="button"
                                                className="transaction-reference-button"
                                                onClick={() => onViewDetail(item.MaThamChieu)}
                                                disabled={Boolean(detailLoadingCode)}
                                                aria-label={`Xem hóa đơn ${item.MaThamChieu}`}
                                            >
                                                {isOpening ? "Đang mở…" : item.MaThamChieu}
                                            </button>
                                        ) : (item.MaThamChieu || "—")}
                                    </td>
                                    <td data-label="Ngày giờ">{formatMemberDateTime(item.ThoiGianGiaoDich)}</td>
                                    <td data-label="Biến động điểm">
                                        <span className={`transaction-points transaction-points--${presentation.className}`}>
                                            {presentation.delta > 0 ? "+" : (presentation.delta < 0 ? "−" : "")}
                                            {formatMemberNumber(Math.abs(presentation.delta))}
                                        </span>
                                    </td>
                                    <td data-label="Trạng thái">
                                        <StatusBadge tone={presentation.tone} icon={presentation.icon}>
                                            {presentation.label}
                                        </StatusBadge>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ul className="transaction-mobile-list" aria-label="Danh sách giao dịch tích điểm">
                {items.map((item, index) => {
                    const presentation = getPointPresentation(item);
                    const canOpenInvoice = item.LoaiGiaoDich === "CongDiemHoaDon" && item.MaThamChieu;
                    const isOpening = detailLoadingCode === item.MaThamChieu;
                    const key = item.MaGiaoDichDiem || `${item.MaThamChieu || "point"}-${index}`;

                    return (
                        <li key={key} className="transaction-mobile-card">
                            <div className="transaction-mobile-card__header">
                                <div>
                                    <span>Mã giao dịch</span>
                                    <strong>{item.MaGiaoDichDiem || "—"}</strong>
                                </div>
                                <StatusBadge tone={presentation.tone} icon={presentation.icon}>
                                    {presentation.label}
                                </StatusBadge>
                            </div>
                            <p className="transaction-mobile-card__content">{getActivityLabel(item.LoaiGiaoDich)}</p>
                            <dl className="transaction-mobile-card__details">
                                <div><dt>Ngày giờ</dt><dd>{formatMemberDateTime(item.ThoiGianGiaoDich)}</dd></div>
                                <div>
                                    <dt>Biến động</dt>
                                    <dd className={`transaction-points transaction-points--${presentation.className}`}>
                                        {presentation.delta > 0 ? "+" : (presentation.delta < 0 ? "−" : "")}
                                        {formatMemberNumber(Math.abs(presentation.delta))}
                                    </dd>
                                </div>
                            </dl>
                            {item.MaThamChieu && (
                                canOpenInvoice ? (
                                    <button
                                        type="button"
                                        className="customer-button customer-button--secondary transaction-detail-button"
                                        onClick={() => onViewDetail(item.MaThamChieu)}
                                        disabled={Boolean(detailLoadingCode)}
                                    >
                                        <FaEye aria-hidden="true" />
                                        {isOpening ? "Đang mở…" : `Hóa đơn ${item.MaThamChieu}`}
                                    </button>
                                ) : (
                                    <span className="transaction-mobile-card__reference">Tham chiếu: {item.MaThamChieu}</span>
                                )
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

function Invoice({ embedded = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [initialInvoiceCode] = useState(() => location.state?.openInvoice || null);
    const [activeTab, setActiveTab] = useState(() => (
        initialInvoiceCode || location.state?.historyTab !== "points" ? "invoices" : "points"
    ));

    const [invoiceItems, setInvoiceItems] = useState([]);
    const [invoicePage, setInvoicePage] = useState(1);
    const [invoiceLastPage, setInvoiceLastPage] = useState(1);
    const [invoiceTotal, setInvoiceTotal] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(true);
    const [invoiceError, setInvoiceError] = useState(null);
    const [invoiceRetryKey, setInvoiceRetryKey] = useState(0);
    const [invoiceFilterDraft, setInvoiceFilterDraft] = useState({ ...INVOICE_DEFAULT_FILTERS });
    const [invoiceFilters, setInvoiceFilters] = useState({ ...INVOICE_DEFAULT_FILTERS });
    const [invoiceFilterError, setInvoiceFilterError] = useState("");

    const [pointItems, setPointItems] = useState([]);
    const [pointPage, setPointPage] = useState(1);
    const [pointLastPage, setPointLastPage] = useState(1);
    const [pointTotal, setPointTotal] = useState(null);
    const [pointLoading, setPointLoading] = useState(true);
    const [pointError, setPointError] = useState(null);
    const [pointRetryKey, setPointRetryKey] = useState(0);
    const [pointFilterDraft, setPointFilterDraft] = useState({ ...POINT_DEFAULT_FILTERS });
    const [pointFilters, setPointFilters] = useState({ ...POINT_DEFAULT_FILTERS });
    const [pointFilterError, setPointFilterError] = useState("");

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [detailLoadingCode, setDetailLoadingCode] = useState("");
    const [detailError, setDetailError] = useState("");
    const detailRequestRef = useRef(false);
    const mountedRef = useRef(true);
    const listTopRef = useRef(null);
    const invoiceTabRef = useRef(null);
    const pointTabRef = useRef(null);

    const storedUser = getStoredCustomerUser();
    const parsedCurrentPoints = Number(storedUser?.TongDiem);
    const currentPoints = Number.isFinite(parsedCurrentPoints)
        ? Math.max(0, parsedCurrentPoints)
        : null;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (activeTab !== "invoices") return undefined;
        let active = true;

        const fetchInvoices = async () => {
            setInvoiceLoading(true);
            setInvoiceError(null);

            try {
                const response = await axiosClient.get("/member/invoices", {
                    params: {
                        page: invoicePage,
                        keyword: invoiceFilters.keyword || undefined,
                        tu_ngay: invoiceFilters.from || undefined,
                        den_ngay: invoiceFilters.to || undefined,
                        sort_order: invoiceFilters.sort,
                    },
                });
                if (!active) return;

                const items = Array.isArray(response.data?.data) ? response.data.data : [];
                const meta = response.data?.meta || {};
                const safeLastPage = Math.max(1, Number(meta.last_page) || 1);

                if (invoicePage > safeLastPage) {
                    setInvoicePage(safeLastPage);
                    return;
                }

                setInvoiceItems(items);
                setInvoiceLastPage(safeLastPage);
                setInvoiceTotal(Math.max(0, Number(meta.total) || 0));
            } catch (error) {
                if (active) setInvoiceError(error);
            } finally {
                if (active) setInvoiceLoading(false);
            }
        };

        void fetchInvoices();
        return () => {
            active = false;
        };
    }, [activeTab, invoiceFilters, invoicePage, invoiceRetryKey]);

    useEffect(() => {
        if (activeTab !== "points") return undefined;
        let active = true;

        const fetchPoints = async () => {
            setPointLoading(true);
            setPointError(null);

            try {
                const response = await getPointHistory({
                    page: pointPage,
                    keyword: pointFilters.keyword || undefined,
                    type: pointFilters.type === "all" ? undefined : pointFilters.type,
                    from: pointFilters.from || undefined,
                    to: pointFilters.to || undefined,
                    sort: pointFilters.sort,
                });
                if (!active) return;

                const items = Array.isArray(response.data?.data) ? response.data.data : [];
                const safeLastPage = Math.max(1, Number(response.data?.last_page) || 1);

                if (pointPage > safeLastPage) {
                    setPointPage(safeLastPage);
                    return;
                }

                setPointItems(items);
                setPointLastPage(safeLastPage);
                setPointTotal(Math.max(0, Number(response.data?.total) || 0));
            } catch (error) {
                if (active) setPointError(error);
            } finally {
                if (active) setPointLoading(false);
            }
        };

        void fetchPoints();
        return () => {
            active = false;
        };
    }, [activeTab, pointFilters, pointPage, pointRetryKey]);

    const loadInvoiceDetail = useCallback(async (invoiceCode) => {
        if (!invoiceCode || detailRequestRef.current) return;

        detailRequestRef.current = true;
        setDetailLoadingCode(invoiceCode);
        setDetailError("");

        try {
            const response = await axiosClient.get(`/member/invoices/${encodeURIComponent(invoiceCode)}`);
            if (mountedRef.current && response.data?.data) {
                setSelectedInvoice(response.data.data);
            }
        } catch (error) {
            if (mountedRef.current) {
                const status = error?.response?.status;
                setDetailError(
                    status === 404
                        ? "Không tìm thấy hóa đơn được yêu cầu."
                        : (status === 401
                            ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                            : "Không thể tải chi tiết hóa đơn lúc này."),
                );
            }
        } finally {
            detailRequestRef.current = false;
            if (mountedRef.current) setDetailLoadingCode("");
        }
    }, []);

    useEffect(() => {
        if (!initialInvoiceCode) return undefined;
        let active = true;

        const openLinkedInvoice = async () => {
            await Promise.resolve();
            if (!active) return;
            void loadInvoiceDetail(initialInvoiceCode);
            navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
        };

        void openLinkedInvoice();
        return () => {
            active = false;
        };
    }, [initialInvoiceCode, loadInvoiceDetail, location.pathname, location.search, navigate]);

    const selectTab = (tab, focus = false) => {
        setActiveTab(tab);
        if (focus) {
            window.requestAnimationFrame(() => {
                (tab === "invoices" ? invoiceTabRef : pointTabRef).current?.focus();
            });
        }
    };

    const handleTabKeyDown = (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        selectTab(activeTab === "invoices" ? "points" : "invoices", true);
    };

    const handleInvoiceFilterSubmit = (event) => {
        event.preventDefault();
        if (hasDateRangeError(invoiceFilterDraft)) {
            setInvoiceFilterError("Đến ngày phải bằng hoặc sau từ ngày.");
            return;
        }

        setInvoiceFilterError("");
        setInvoiceFilters({
            ...invoiceFilterDraft,
            keyword: invoiceFilterDraft.keyword.trim(),
        });
        setInvoicePage(1);
    };

    const resetInvoiceFilters = () => {
        setInvoiceFilterDraft({ ...INVOICE_DEFAULT_FILTERS });
        setInvoiceFilters({ ...INVOICE_DEFAULT_FILTERS });
        setInvoiceFilterError("");
        setInvoicePage(1);
    };

    const handlePointFilterSubmit = (event) => {
        event.preventDefault();
        if (hasDateRangeError(pointFilterDraft)) {
            setPointFilterError("Đến ngày phải bằng hoặc sau từ ngày.");
            return;
        }

        setPointFilterError("");
        setPointFilters({
            ...pointFilterDraft,
            keyword: pointFilterDraft.keyword.trim(),
        });
        setPointPage(1);
    };

    const resetPointFilters = () => {
        setPointFilterDraft({ ...POINT_DEFAULT_FILTERS });
        setPointFilters({ ...POINT_DEFAULT_FILTERS });
        setPointFilterError("");
        setPointPage(1);
    };

    const scrollToResults = () => {
        window.requestAnimationFrame(() => {
            const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            listTopRef.current?.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                block: "start",
            });
        });
    };

    const changeInvoicePage = (page) => {
        const safePage = Math.max(1, Math.min(invoiceLastPage, Number(page) || 1));
        if (safePage === invoicePage || invoiceLoading) return;
        setInvoicePage(safePage);
        scrollToResults();
    };

    const changePointPage = (page) => {
        const safePage = Math.max(1, Math.min(pointLastPage, Number(page) || 1));
        if (safePage === pointPage || pointLoading) return;
        setPointPage(safePage);
        scrollToResults();
    };

    const hasInvoiceFilters = Boolean(
        invoiceFilters.keyword || invoiceFilters.from || invoiceFilters.to,
    );
    const hasPointFilters = Boolean(
        pointFilters.keyword
        || pointFilters.from
        || pointFilters.to
        || pointFilters.type !== "all",
    );
    const invoiceErrorCopy = getHistoryErrorCopy(invoiceError, "lịch sử hóa đơn");
    const pointErrorCopy = getHistoryErrorCopy(pointError, "lịch sử tích điểm");

    let pointEmptyTitle = "Chưa có lịch sử tích điểm";
    let pointEmptyDescription = "Các giao dịch cộng hoặc trừ điểm sẽ xuất hiện tại đây.";
    if (hasPointFilters) {
        pointEmptyTitle = pointFilters.type === "CongDiemHoaDon"
            ? "Không tìm thấy giao dịch cộng điểm"
            : (pointFilters.type === "DoiVoucher"
                ? "Không tìm thấy giao dịch trừ điểm"
                : "Không có giao dịch phù hợp bộ lọc");
        pointEmptyDescription = "Hãy thay đổi từ khóa, loại giao dịch hoặc khoảng ngày rồi thử lại.";
    }

    return (
        <div className={`transaction-page ${embedded ? "transaction-page--embedded" : ""}`.trim()}>
            <div className="customer-shell">
                {!embedded && (
                    <SectionHeading
                        eyebrow="Hoạt động thành viên"
                        title="Lịch sử giao dịch"
                        description="Theo dõi hóa đơn, biến động điểm và mở lại chi tiết giao dịch trong cùng một nơi."
                        action={currentPoints !== null ? (
                            <StatusBadge tone="success" icon={<FaStar />}>
                                {formatMemberNumber(currentPoints)} điểm
                            </StatusBadge>
                        ) : null}
                    />
                )}

                <div className="transaction-layout">
                    {!embedded && <AccountNavigation activeKey="transactions" />}

                    <div className="transaction-content">
                        <div
                            className="transaction-tabs"
                            role="tablist"
                            aria-label="Chọn loại lịch sử"
                            onKeyDown={handleTabKeyDown}
                        >
                            <button
                                ref={invoiceTabRef}
                                type="button"
                                role="tab"
                                id="invoice-history-tab"
                                aria-controls="invoice-history-panel"
                                aria-selected={activeTab === "invoices"}
                                tabIndex={activeTab === "invoices" ? 0 : -1}
                                className={activeTab === "invoices" ? "is-active" : ""}
                                onClick={() => selectTab("invoices")}
                            >
                                <FaFileInvoiceDollar aria-hidden="true" />
                                <span>Hóa đơn</span>
                            </button>
                            <button
                                ref={pointTabRef}
                                type="button"
                                role="tab"
                                id="point-history-tab"
                                aria-controls="point-history-panel"
                                aria-selected={activeTab === "points"}
                                tabIndex={activeTab === "points" ? 0 : -1}
                                className={activeTab === "points" ? "is-active" : ""}
                                onClick={() => selectTab("points")}
                            >
                                <FaCoins aria-hidden="true" />
                                <span>Lịch sử tích điểm</span>
                            </button>
                        </div>

                        <div ref={listTopRef} className="transaction-results-anchor" />

                        {detailError && (
                            <div className="transaction-detail-error" role="alert">
                                <span>{detailError}</span>
                                <button type="button" onClick={() => setDetailError("")} aria-label="Đóng thông báo lỗi chi tiết hóa đơn">
                                    ×
                                </button>
                            </div>
                        )}

                        {activeTab === "invoices" ? (
                            <section
                                id="invoice-history-panel"
                                role="tabpanel"
                                aria-labelledby="invoice-history-tab"
                                className="transaction-panel"
                            >
                                <HistorySummary
                                    total={invoiceTotal}
                                    currentPage={invoicePage}
                                    totalPages={invoiceLastPage}
                                    currentPoints={currentPoints}
                                    label="Hóa đơn phù hợp"
                                    loading={invoiceLoading}
                                />

                                <form onSubmit={handleInvoiceFilterSubmit} className="transaction-filter-form">
                                    <TransactionFilterBar
                                        ariaLabel="Lọc lịch sử hóa đơn"
                                        actions={(
                                            <>
                                                <button
                                                    type="submit"
                                                    className="customer-button customer-button--primary"
                                                    disabled={invoiceLoading}
                                                >
                                                    <FaSearch aria-hidden="true" />
                                                    Tìm kiếm
                                                </button>
                                                <button
                                                    type="button"
                                                    className="customer-button customer-button--ghost"
                                                    onClick={resetInvoiceFilters}
                                                    disabled={invoiceLoading}
                                                >
                                                    <FaSyncAlt aria-hidden="true" />
                                                    Đặt lại
                                                </button>
                                            </>
                                        )}
                                    >
                                        <div className="customer-form-field transaction-filter-field--search">
                                            <label className="customer-form-field__label" htmlFor="invoice-keyword">
                                                Mã hóa đơn
                                            </label>
                                            <div className="transaction-search-control">
                                                <FaSearch aria-hidden="true" />
                                                <input
                                                    id="invoice-keyword"
                                                    className="customer-input"
                                                    type="search"
                                                    placeholder="Ví dụ: HD105"
                                                    maxLength={100}
                                                    value={invoiceFilterDraft.keyword}
                                                    onChange={(event) => {
                                                        setInvoiceFilterDraft((current) => ({
                                                            ...current,
                                                            keyword: event.target.value,
                                                        }));
                                                        setInvoiceFilterError("");
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="customer-form-field">
                                            <label className="customer-form-field__label" htmlFor="invoice-from">Từ ngày</label>
                                            <input
                                                id="invoice-from"
                                                className="customer-input"
                                                type="date"
                                                value={invoiceFilterDraft.from}
                                                max={invoiceFilterDraft.to || undefined}
                                                onChange={(event) => {
                                                    setInvoiceFilterDraft((current) => ({ ...current, from: event.target.value }));
                                                    setInvoiceFilterError("");
                                                }}
                                            />
                                        </div>
                                        <div className="customer-form-field">
                                            <label className="customer-form-field__label" htmlFor="invoice-to">Đến ngày</label>
                                            <input
                                                id="invoice-to"
                                                className="customer-input"
                                                type="date"
                                                value={invoiceFilterDraft.to}
                                                min={invoiceFilterDraft.from || undefined}
                                                onChange={(event) => {
                                                    setInvoiceFilterDraft((current) => ({ ...current, to: event.target.value }));
                                                    setInvoiceFilterError("");
                                                }}
                                            />
                                        </div>
                                        <div className="customer-form-field">
                                            <label className="customer-form-field__label" htmlFor="invoice-sort">Sắp xếp</label>
                                            <select
                                                id="invoice-sort"
                                                className="customer-select"
                                                value={invoiceFilterDraft.sort}
                                                onChange={(event) => setInvoiceFilterDraft((current) => ({
                                                    ...current,
                                                    sort: event.target.value,
                                                }))}
                                            >
                                                <option value="newest">Hóa đơn mới nhất</option>
                                                <option value="oldest">Hóa đơn cũ nhất</option>
                                            </select>
                                        </div>
                                    </TransactionFilterBar>
                                    {invoiceFilterError && (
                                        <p className="transaction-filter-error" role="alert">
                                            <FaFilter aria-hidden="true" /> {invoiceFilterError}
                                        </p>
                                    )}
                                </form>

                                {invoiceError && invoiceItems.length > 0 && (
                                    <div className="transaction-refresh-error" role="status">
                                        <span>Không thể làm mới danh sách. Dữ liệu gần nhất vẫn được giữ lại.</span>
                                        {invoiceErrorCopy.canRetry && (
                                            <button type="button" onClick={() => setInvoiceRetryKey((current) => current + 1)}>
                                                Thử lại
                                            </button>
                                        )}
                                    </div>
                                )}

                                {invoiceLoading && invoiceItems.length === 0 ? (
                                    <div className="transaction-loading-panel">
                                        <LoadingSkeleton lines={6} ariaLabel="Đang tải lịch sử hóa đơn" />
                                    </div>
                                ) : invoiceError && invoiceItems.length === 0 ? (
                                    <ErrorState
                                        title={invoiceErrorCopy.title}
                                        description={invoiceErrorCopy.description}
                                        onRetry={invoiceErrorCopy.canRetry
                                            ? () => setInvoiceRetryKey((current) => current + 1)
                                            : undefined}
                                        icon={<FaFileInvoiceDollar />}
                                    />
                                ) : invoiceItems.length === 0 ? (
                                    <EmptyState
                                        title={hasInvoiceFilters ? "Không có hóa đơn phù hợp" : "Chưa có hóa đơn"}
                                        description={hasInvoiceFilters
                                            ? "Hãy thay đổi mã hóa đơn hoặc khoảng ngày rồi thử lại."
                                            : "Hóa đơn phát sinh từ các giao dịch của bạn sẽ xuất hiện tại đây."}
                                        icon={<FaReceipt />}
                                    />
                                ) : (
                                    <>
                                        {invoiceLoading && (
                                            <div className="transaction-updating" role="status">Đang cập nhật danh sách…</div>
                                        )}
                                        <InvoiceHistoryTable
                                            items={invoiceItems}
                                            detailLoadingCode={detailLoadingCode}
                                            onViewDetail={loadInvoiceDetail}
                                        />
                                        <div className="transaction-pagination-wrap">
                                            <span>{formatMemberNumber(invoiceTotal ?? 0)} kết quả</span>
                                            <Pagination
                                                currentPage={invoicePage}
                                                totalPages={invoiceLastPage}
                                                onPageChange={changeInvoicePage}
                                                disabled={invoiceLoading}
                                                ariaLabel="Phân trang hóa đơn"
                                            />
                                        </div>
                                    </>
                                )}
                            </section>
                        ) : (
                            <section
                                id="point-history-panel"
                                role="tabpanel"
                                aria-labelledby="point-history-tab"
                                className="transaction-panel"
                            >
                                <HistorySummary
                                    total={pointTotal}
                                    currentPage={pointPage}
                                    totalPages={pointLastPage}
                                    currentPoints={currentPoints}
                                    label="Giao dịch điểm phù hợp"
                                    loading={pointLoading}
                                />

                                <form onSubmit={handlePointFilterSubmit} className="transaction-filter-form">
                                    <TransactionFilterBar
                                        ariaLabel="Lọc lịch sử tích điểm"
                                        actions={(
                                            <>
                                                <button
                                                    type="submit"
                                                    className="customer-button customer-button--primary"
                                                    disabled={pointLoading}
                                                >
                                                    <FaSearch aria-hidden="true" />
                                                    Tìm kiếm
                                                </button>
                                                <button
                                                    type="button"
                                                    className="customer-button customer-button--ghost"
                                                    onClick={resetPointFilters}
                                                    disabled={pointLoading}
                                                >
                                                    <FaSyncAlt aria-hidden="true" />
                                                    Đặt lại
                                                </button>
                                            </>
                                        )}
                                    >
                                        <div className="customer-form-field transaction-filter-field--search">
                                            <label className="customer-form-field__label" htmlFor="point-keyword">
                                                Mã giao dịch hoặc tham chiếu
                                            </label>
                                            <div className="transaction-search-control">
                                                <FaSearch aria-hidden="true" />
                                                <input
                                                    id="point-keyword"
                                                    className="customer-input"
                                                    type="search"
                                                    placeholder="Ví dụ: GDD105 hoặc HD20"
                                                    maxLength={100}
                                                    value={pointFilterDraft.keyword}
                                                    onChange={(event) => {
                                                        setPointFilterDraft((current) => ({
                                                            ...current,
                                                            keyword: event.target.value,
                                                        }));
                                                        setPointFilterError("");
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="customer-form-field">
                                            <label className="customer-form-field__label" htmlFor="point-type">Loại giao dịch</label>
                                            <select
                                                id="point-type"
                                                className="customer-select"
                                                value={pointFilterDraft.type}
                                                onChange={(event) => setPointFilterDraft((current) => ({
                                                    ...current,
                                                    type: event.target.value,
                                                }))}
                                            >
                                                {POINT_TYPE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="customer-form-field">
                                            <label className="customer-form-field__label" htmlFor="point-from">Từ ngày</label>
                                            <input
                                                id="point-from"
                                                className="customer-input"
                                                type="date"
                                                value={pointFilterDraft.from}
                                                max={pointFilterDraft.to || undefined}
                                                onChange={(event) => {
                                                    setPointFilterDraft((current) => ({ ...current, from: event.target.value }));
                                                    setPointFilterError("");
                                                }}
                                            />
                                        </div>
                                        <div className="customer-form-field">
                                            <label className="customer-form-field__label" htmlFor="point-to">Đến ngày</label>
                                            <input
                                                id="point-to"
                                                className="customer-input"
                                                type="date"
                                                value={pointFilterDraft.to}
                                                min={pointFilterDraft.from || undefined}
                                                onChange={(event) => {
                                                    setPointFilterDraft((current) => ({ ...current, to: event.target.value }));
                                                    setPointFilterError("");
                                                }}
                                            />
                                        </div>
                                        <div className="customer-form-field">
                                            <label className="customer-form-field__label" htmlFor="point-sort">Sắp xếp</label>
                                            <select
                                                id="point-sort"
                                                className="customer-select"
                                                value={pointFilterDraft.sort}
                                                onChange={(event) => setPointFilterDraft((current) => ({
                                                    ...current,
                                                    sort: event.target.value,
                                                }))}
                                            >
                                                {POINT_SORT_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </TransactionFilterBar>
                                    {pointFilterError && (
                                        <p className="transaction-filter-error" role="alert">
                                            <FaFilter aria-hidden="true" /> {pointFilterError}
                                        </p>
                                    )}
                                </form>

                                {pointError && pointItems.length > 0 && (
                                    <div className="transaction-refresh-error" role="status">
                                        <span>Không thể làm mới danh sách. Dữ liệu gần nhất vẫn được giữ lại.</span>
                                        {pointErrorCopy.canRetry && (
                                            <button type="button" onClick={() => setPointRetryKey((current) => current + 1)}>
                                                Thử lại
                                            </button>
                                        )}
                                    </div>
                                )}

                                {pointLoading && pointItems.length === 0 ? (
                                    <div className="transaction-loading-panel">
                                        <LoadingSkeleton lines={7} ariaLabel="Đang tải lịch sử tích điểm" />
                                    </div>
                                ) : pointError && pointItems.length === 0 ? (
                                    <ErrorState
                                        title={pointErrorCopy.title}
                                        description={pointErrorCopy.description}
                                        onRetry={pointErrorCopy.canRetry
                                            ? () => setPointRetryKey((current) => current + 1)
                                            : undefined}
                                        icon={<FaCoins />}
                                    />
                                ) : pointItems.length === 0 ? (
                                    <EmptyState
                                        title={pointEmptyTitle}
                                        description={pointEmptyDescription}
                                        icon={<FaCoins />}
                                    />
                                ) : (
                                    <>
                                        {pointLoading && (
                                            <div className="transaction-updating" role="status">Đang cập nhật danh sách…</div>
                                        )}
                                        <PointHistoryTable
                                            items={pointItems}
                                            detailLoadingCode={detailLoadingCode}
                                            onViewDetail={loadInvoiceDetail}
                                        />
                                        <div className="transaction-pagination-wrap">
                                            <span>{formatMemberNumber(pointTotal ?? 0)} kết quả</span>
                                            <Pagination
                                                currentPage={pointPage}
                                                totalPages={pointLastPage}
                                                onPageChange={changePointPage}
                                                disabled={pointLoading}
                                                ariaLabel="Phân trang lịch sử tích điểm"
                                            />
                                        </div>
                                    </>
                                )}
                            </section>
                        )}
                    </div>
                </div>
            </div>

            <InvoiceDetailModal
                key={selectedInvoice?.MaHoaDon || "invoice-detail"}
                show={Boolean(selectedInvoice)}
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
            />
        </div>
    );
}

export default Invoice;
