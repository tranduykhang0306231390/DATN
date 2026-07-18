import { useEffect, useState } from "react";
import { getPointHistory } from "../../api/authApi";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
function PointHistory() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);

    const [links, setLinks] = useState([]);
    const [keyword, setKeyword] = useState("");

    const [type, setType] = useState("all");

    const [fromDate, setFromDate] = useState("");

    const [toDate, setToDate] = useState("");

    const [sort, setSort] = useState("latest");

    const loadHistory = async (page = 1) => {

        try {

            const res = await getPointHistory({

                page,

                keyword,

                type,

                from: fromDate,

                to: toDate,

                sort

            });

            setHistory(res.data.data);

            setLinks(res.data.links);

        } catch (error) {

            console.log(error);

            Swal.fire({
                icon: "error",
                title: "Không tải được lịch sử giao dịch điểm"
            });

        }

    };

    useEffect(() => {

        const timer = setTimeout(() => {

            loadHistory();

        }, 400);

        return () => clearTimeout(timer);

    }, [
        keyword,
        type,
        fromDate,
        toDate,
        sort
    ]);

    const getLoai = (loai) => {

        switch (loai) {

            case "CongDiemHoaDon":
                return " Cộng điểm hóa đơn";

            case "DoiVoucher":
                return " Đổi voucher";

            default:
                return loai;

        }

    };

    return (

        <div className="card shadow mt-5">

            <div className="card-header">

                <h4>Lịch sử giao dịch điểm</h4>

            </div>

            <div className="card-body">
                <div className="row g-3 mb-4">

                    {/* Tìm kiếm */}

                    <div className="col-lg-4">

                        <div className="input-group">

                            <span className="input-group-text bg-white">
                                <i className="bi bi-search"></i>
                            </span>

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Tìm theo mã tham chiếu..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />

                        </div>

                    </div>

                    {/* Loại giao dịch */}

                    <div className="col-lg-2">

                        <select
                            className="form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >

                            <option value="all">Tất cả</option>

                            <option value="CongDiemHoaDon">
                                Cộng điểm
                            </option>

                            <option value="DoiVoucher">
                                Đổi voucher
                            </option>

                        </select>

                    </div>

                    {/* Từ ngày */}

                    <div className="col-lg-2">

                        <input
                            type="date"
                            className="form-control"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />

                    </div>

                    {/* Đến ngày */}

                    <div className="col-lg-2">

                        <input
                            type="date"
                            className="form-control"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />

                    </div>

                    {/* Sắp xếp */}

                    <div className="col-lg-2">

                        <select
                            className="form-select"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >

                            <option value="latest">
                                Mới nhất
                            </option>

                            <option value="oldest">
                                Cũ nhất
                            </option>

                            <option value="point_desc">
                                Điểm giảm dần
                            </option>

                            <option value="point_asc">
                                Điểm tăng dần
                            </option>

                        </select>

                    </div>

                </div>

                <div className="d-flex justify-content-end mb-3">

                    <button
                        className="btn btn-outline-secondary"

                        onClick={() => {

                            setKeyword("");

                            setType("all");

                            setFromDate("");

                            setToDate("");

                            setSort("latest");

                        }}

                    >

                        <i className="bi bi-arrow-counterclockwise me-2"></i>

                        Đặt lại

                    </button>

                </div>

                <table className="table table-hover">

                    <thead>

                        <tr>

                            <th>Ngày</th>

                            <th>Loại</th>

                            <th>Điểm</th>

                            <th>Trước</th>

                            <th>Sau</th>

                            <th>Tham chiếu</th>

                        </tr>

                    </thead>

                    <tbody>

                        {
                            history.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="text-center py-5"
                                    >

                                        <i
                                            className="bi bi-clock-history"
                                            style={{
                                                fontSize: "55px",
                                                color: "#adb5bd"
                                            }}
                                        ></i>

                                        <h5 className="mt-3 text-secondary">
                                            Chưa có giao dịch điểm nào
                                        </h5>

                                        <p className="text-muted mb-0">
                                            Khi bạn tích điểm hoặc đổi voucher,
                                            lịch sử sẽ xuất hiện tại đây.
                                        </p>

                                    </td>

                                </tr>

                            ) : (

                                history.map(item => (

                                    <tr key={item.MaGiaoDichDiem}>

                                        <td>{item.ThoiGianGiaoDich}</td>

                                        <td>{getLoai(item.LoaiGiaoDich)}</td>

                                        <td>

                                            {
                                                item.LoaiGiaoDich === "DoiVoucher"

                                                    ?

                                                    <span className="text-danger fw-bold">
                                                        -{item.SoDiem}
                                                    </span>

                                                    :

                                                    <span className="text-success fw-bold">
                                                        +{item.SoDiem}
                                                    </span>
                                            }

                                        </td>

                                        <td>{item.SoDiemTruoc}</td>

                                        <td>{item.SoDiemSau}</td>

                                        <td>
                                            {item.LoaiGiaoDich === "CongDiemHoaDon" ? (
                                                <button
                                                    className="btn btn-link p-0 fw-bold text-decoration-none"
                                                    onClick={() =>
                                                        navigate("/member/invoice", {
                                                            state: {
                                                                openInvoice: item.MaThamChieu
                                                            }
                                                        })
                                                    }
                                                >
                                                    {item.MaThamChieu}
                                                </button>
                                            ) : (
                                                item.MaThamChieu
                                            )}
                                        </td>
                                    </tr>

                                ))

                            )
                        }

                    </tbody>

                </table>
                {
                    history.length > 0 && (
                        <div className="d-flex justify-content-center">

                            {

                                links.map((link, index) => (

                                    <button

                                        key={index}

                                        className={`btn btn-sm mx-1 ${link.active ? "btn-primary" : "btn-outline-primary"}`}

                                        disabled={!link.url}

                                        onClick={() => {

                                            if (link.url) {

                                                const page = new URL(link.url).searchParams.get("page");

                                                loadHistory(Number(page));

                                            }

                                        }}

                                        dangerouslySetInnerHTML={{ __html: link.label }}

                                    />

                                ))

                            }

                        </div>
                    )
                }



            </div>

        </div>

    );

}

export default PointHistory;