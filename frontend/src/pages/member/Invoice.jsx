import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; import axiosClient from "../../api/axiosClient";
import InvoiceDetailModal from "./InvoiceDetailModal";

import "../../assets/css/member/Invoice.css";

const SORT_OPTIONS = [
    { value: "newest", label: "Mới nhất" },
    { value: "oldest", label: "Cũ nhất" },
];

const DEFAULT_FILTERS = {
    keyword: "",
    tuNgay: "",
    denNgay: "",
    sortOrder: "newest",
};

function Invoice() {

    const [data, setData] = useState([]);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [pendingInvoice, setPendingInvoice] = useState(null);

    // Giá trị đang gõ trong ô tìm kiếm / bộ lọc (chưa áp dụng)
    const [filterDraft, setFilterDraft] = useState(DEFAULT_FILTERS);
    // Bộ lọc đã áp dụng (dùng để gọi API)
    const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

    useEffect(() => {
        loadInvoices(currentPage, appliedFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, appliedFilters]);

    useEffect(() => {
        if (location.state?.openInvoice) {
            setPendingInvoice(location.state.openInvoice);
            navigate(location.pathname,{replace:true,state:{}});
        }
    }, [location.state,navigate,location.pathname]);

    useEffect(()=>{
        if(!loading && pendingInvoice){
            handleViewDetail(pendingInvoice);
            setPendingInvoice(null);
        }
    },[loading,pendingInvoice]);

    const loadInvoices = async (page = 1, filters = appliedFilters) => {

        setLoading(true);

        try {

            const res = await axiosClient.get("/member/invoices", {
                params: {
                    page,
                    keyword: filters.keyword || undefined,
                    tu_ngay: filters.tuNgay || undefined,
                    den_ngay: filters.denNgay || undefined,
                    sort_order: filters.sortOrder || "newest",
                }
            });

            const meta = res.data.meta || res.data;

            setData(res.data.data);
            setCurrentPage(meta.current_page || page);
            setLastPage(meta.last_page || 1);
            setTotal(meta.total ?? res.data.data.length);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    };

    const handleFilterChange = (field, value) => {
        setFilterDraft((prev) => ({ ...prev, [field]: value }));
    };

    const handleSearch = () => {
        setAppliedFilters(filterDraft);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setFilterDraft(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
        setCurrentPage(1);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleViewDetail = async (maHoaDon) => {

        try {

            const res = await axiosClient.get(`/member/invoices/${maHoaDon}`);

            setSelectedInvoice(res.data.data);
            setShowDetail(true);

        } catch (error) {

            console.error(error);

        }

    };

    const goToPage = (page) => {

        if (page < 1 || page > lastPage || page === currentPage) return;

        setCurrentPage(page);

    };

    const getPageNumbers = () => {

        const maxVisible = 5;

        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(lastPage, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        const pages = [];

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (

        <div className="invoice-page">

            <div className="container">

                <div className="invoice-title">

                    <h2>Lịch sử giao dịch</h2>

                    <p>
                        Theo dõi toàn bộ lịch sử thanh toán và xem chi tiết từng hóa đơn.
                    </p>

                </div>

                <div className="invoice-filter row g-2 align-items-end mb-3">

                    <div className="col-12 col-md-3">
                        <label className="form-label mb-1">Tìm kiếm mã HD</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập mã hóa đơn..."
                            value={filterDraft.keyword}
                            onChange={(e) => handleFilterChange("keyword", e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label mb-1">Từ ngày</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filterDraft.tuNgay}
                            onChange={(e) => handleFilterChange("tuNgay", e.target.value)}
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label mb-1">Đến ngày</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filterDraft.denNgay}
                            onChange={(e) => handleFilterChange("denNgay", e.target.value)}
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label mb-1">Sắp xếp</label>
                        <select
                            className="form-select"
                            value={filterDraft.sortOrder}
                            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-auto d-flex gap-2">
                        <button
                            type="button"
                            className="invoice-btn"
                            onClick={handleSearch}
                        >
                            Tìm kiếm
                        </button>

                        <button
                            type="button"
                            className="invoice-btn invoice-btn-reset"
                            onClick={handleReset}
                        >
                            Đặt lại
                        </button>
                    </div>

                </div>

                <div className="invoice-table">

                    <table className="table text-center align-middle">

                        <thead>

                            <tr>

                                <th>Mã hóa đơn</th>

                                <th>Ngày lập</th>

                                <th>Tổng tiền</th>

                                <th width="170">
                                    Thao tác
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="invoice-loading"
                                    >
                                        Đang tải dữ liệu...
                                    </td>

                                </tr>

                            ) : data.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="invoice-empty"
                                    >
                                        Không tìm thấy hóa đơn phù hợp.
                                    </td>

                                </tr>

                            ) : (

                                data.map((item) => (

                                    <tr key={item.MaHoaDon}>

                                        <td>
                                            <strong>
                                                {item.MaHoaDon}
                                            </strong>
                                        </td>

                                        <td>
                                            {item.NgayLap}
                                        </td>

                                        <td className="invoice-price">
                                            {Number(item.TongTien).toLocaleString()} đ
                                        </td>

                                        <td>

                                            <button
                                                className="invoice-btn"
                                                onClick={() =>
                                                    handleViewDetail(item.MaHoaDon)
                                                }
                                            >
                                                Xem chi tiết
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                {!loading && total > 0 && (

                    <div className="invoice-footer d-flex flex-column flex-lg-row justify-content-between align-items-center">

                        <div className="invoice-total">

                            Tổng cộng <strong>{total}</strong> hóa đơn
                            &nbsp;|&nbsp;
                            Trang <strong>{currentPage}</strong> / {lastPage}

                        </div>

                        <nav>

                            <ul className="pagination mb-0">

                                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>

                                    <button
                                        className="page-link"
                                        onClick={() => goToPage(currentPage - 1)}
                                    >
                                        «
                                    </button>

                                </li>

                                {getPageNumbers()[0] > 1 && (

                                    <>

                                        <li className="page-item">

                                            <button
                                                className="page-link"
                                                onClick={() => goToPage(1)}
                                            >
                                                1
                                            </button>

                                        </li>

                                        {getPageNumbers()[0] > 2 && (

                                            <li className="page-item disabled">

                                                <span className="page-link">
                                                    ...
                                                </span>

                                            </li>

                                        )}

                                    </>

                                )}

                                {getPageNumbers().map((page) => (

                                    <li
                                        key={page}
                                        className={`page-item ${page === currentPage ? "active" : ""}`}
                                    >

                                        <button
                                            className="page-link"
                                            onClick={() => goToPage(page)}
                                        >
                                            {page}
                                        </button>

                                    </li>

                                ))}

                                {getPageNumbers()[getPageNumbers().length - 1] < lastPage && (

                                    <>

                                        {getPageNumbers()[getPageNumbers().length - 1] < lastPage - 1 && (

                                            <li className="page-item disabled">

                                                <span className="page-link">
                                                    ...
                                                </span>

                                            </li>

                                        )}

                                        <li className="page-item">

                                            <button
                                                className="page-link"
                                                onClick={() => goToPage(lastPage)}
                                            >
                                                {lastPage}
                                            </button>

                                        </li>

                                    </>

                                )}

                                <li className={`page-item ${currentPage === lastPage ? "disabled" : ""}`}>

                                    <button
                                        className="page-link"
                                        onClick={() => goToPage(currentPage + 1)}
                                    >
                                        »
                                    </button>

                                </li>

                            </ul>

                        </nav>

                    </div>

                )}

            </div>

            <InvoiceDetailModal
                show={showDetail}
                invoice={selectedInvoice}
                onClose={() => setShowDetail(false)}
            />

        </div>

    );
}

export default Invoice;
