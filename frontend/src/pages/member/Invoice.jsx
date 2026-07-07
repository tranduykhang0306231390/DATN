import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import InvoiceDetailModal from "./InvoiceDetailModal";

import "../../assets/css/member/Invoice.css";

function Invoice() {

    const [data, setData] = useState([]);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

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

                <div className="invoice-table">

                    <table className="table text-center align-middle">

                        <thead>

                            <tr>

                                <th>Mã hóa đơn</th>

                                <th>Ngày lập</th>

                                <th>Tổng tiền</th>

                                <th>Điểm sử dụng</th>

                                <th width="170">
                                    Thao tác
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="invoice-loading"
                                    >
                                        Đang tải dữ liệu...
                                    </td>

                                </tr>

                            ) : data.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="invoice-empty"
                                    >
                                        Bạn chưa có hóa đơn nào.
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

                                            <span className="invoice-point">

                                                Điểm sử dụng {item.DiemSuDung}

                                            </span>

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