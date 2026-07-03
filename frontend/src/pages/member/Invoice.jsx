import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import InvoiceDetailModal from "./InvoiceDetailModal";

function Invoice() {
    const [data, setData] = useState([]);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const res = await axiosClient.get("/member/invoices");
            setData(res.data.data);
        } catch (error) {
            console.error(error);
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

                    {data.length === 0 ? (

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

            <InvoiceDetailModal
                show={showDetail}
                invoice={selectedInvoice}
                onClose={() => setShowDetail(false)}
            />

        </div>
    );
}

export default Invoice;