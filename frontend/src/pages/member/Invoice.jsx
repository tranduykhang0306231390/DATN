import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import InvoiceDetailModal from "./InvoiceDetailModal";

function Invoice() {
    const [data, setData] = useState([]);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // ===== PHÂN TRANG =====
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInvoices(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const loadInvoices = async (page = 1) => {
        setLoading(true);

        try {
            const res = await axiosClient.get("/member/invoices", {
                params: { page }
            });

            // Hỗ trợ cả 2 kiểu response phổ biến của Laravel:
            // 1) paginate() mặc định: { data, current_page, last_page, total }
            // 2) API Resource collection: { data, meta: { current_page, last_page, total } }
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

    // Tạo danh sách số trang hiển thị, tối đa 5 số quanh trang hiện tại
    const getPageNumbers = () => {
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(lastPage, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        const pages = [];
        for (let p = start; p <= end; p++) pages.push(p);
        return pages;
    };

    return (
        <div className="container py-4">

            <h2 className="text-center mb-4">
                Hóa đơn của tôi
            </h2>

            <table className="table table-bordered table-hover text-center align-middle">

                <thead className="table-success">

                    <tr>
                        <th>Mã hóa đơn</th>
                        <th>Ngày lập</th>
                        <th>Tổng tiền</th>
                        <th>Điểm dùng</th>
                        <th width="150">Thao tác</th>
                    </tr>

                </thead>

                <tbody>

                    {loading ? (

                        <tr>
                            <td colSpan="5">
                                Đang tải...
                            </td>
                        </tr>

                    ) : data.length === 0 ? (

                        <tr>

                            <td colSpan="5">
                                Chưa có hóa đơn
                            </td>

                        </tr>

                    ) : (

                        data.map((item) => (

                            <tr key={item.MaHoaDon}>

                                <td>{item.MaHoaDon}</td>

                                <td>{item.NgayLap}</td>

                                <td>{Number(item.TongTien).toLocaleString()} đ</td>

                                <td>{item.DiemSuDung}</td>

                                <td>

                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleViewDetail(item.MaHoaDon)}
                                    >
                                        Xem chi tiết
                                    </button>

                                </td>

                            </tr>

                        ))

                    )}

                </tbody>

            </table>

            {/* ===== THANH PHÂN TRANG ===== */}
            {!loading && total > 0 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">

                    <small className="text-muted">
                        Tổng cộng {total} hóa đơn — Trang {currentPage}/{lastPage}
                    </small>

                    <nav aria-label="Phân trang hóa đơn">
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
                                        <button className="page-link" onClick={() => goToPage(1)}>1</button>
                                    </li>
                                    {getPageNumbers()[0] > 2 && (
                                        <li className="page-item disabled">
                                            <span className="page-link">…</span>
                                        </li>
                                    )}
                                </>
                            )}

                            {getPageNumbers().map((p) => (
                                <li
                                    key={p}
                                    className={`page-item ${p === currentPage ? "active" : ""}`}
                                >
                                    <button className="page-link" onClick={() => goToPage(p)}>
                                        {p}
                                    </button>
                                </li>
                            ))}

                            {getPageNumbers()[getPageNumbers().length - 1] < lastPage && (
                                <>
                                    {getPageNumbers()[getPageNumbers().length - 1] < lastPage - 1 && (
                                        <li className="page-item disabled">
                                            <span className="page-link">…</span>
                                        </li>
                                    )}
                                    <li className="page-item">
                                        <button className="page-link" onClick={() => goToPage(lastPage)}>
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

            <InvoiceDetailModal
                show={showDetail}
                invoice={selectedInvoice}
                onClose={() => setShowDetail(false)}
            />

        </div>
    );
}

export default Invoice;
