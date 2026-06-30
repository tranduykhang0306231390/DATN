import { useEffect, useState } from "react";
import { getPointHistory } from "../../api/authApi";
import Swal from "sweetalert2";

function PointHistory() {

    const [history, setHistory] = useState([]);

    const [links, setLinks] = useState([]);

    const loadHistory = async (page = 1) => {

        try {

            const res = await getPointHistory(page);

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

        loadHistory();

    }, []);

    const getLoai = (loai) => {

        switch (loai) {

            case "CongDiemHoaDon":
                return "🟢 Cộng điểm hóa đơn";

            case "DoiVoucher":
                return "🔴 Đổi voucher";

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

                                        <td>{item.MaThamChieu}</td>

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

                                                loadHistory(page);

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