import { useEffect, useState } from "react";
import { getMemberProfile } from "../../api/authApi";
import Swal from "sweetalert2";

function Profile() {

    const [user, setUser] = useState(null);
    const getRankName = (maHang) => {

        switch (maHang) {

            case "HTV001":
                return "🥉 Đồng";

            case "HTV002":
                return "🥈 Bạc";

            case "HTV003":
                return "🥇 Vàng";

            case "HTV004":
                return "💎 Kim cương";

            default:
                return "Chưa có hạng";

        }

    };

    useEffect(() => {

        loadProfile();

    }, []);

    const loadProfile = async () => {

        try {

            const response = await getMemberProfile();

            setUser(response.data.user);

        } catch (error) {

            console.log(error);

            console.log(error.response);

            console.log(error.response?.data);

            Swal.fire({
                icon: "error",
                title: "Không lấy được thông tin"
            });

        }

    };

    if (!user) {

        return (
            <div className="container mt-5">

                <h3>Đang tải...</h3>

            </div>
        );

    }

    return (

        <div className="container mt-5">

            <div className="card shadow">

                <div className="card-header bg-dark text-white">

                    <h3>Thông tin cá nhân</h3>

                </div>

                <div className="card-body">

                    <table className="table">

                        <tbody>

                            <tr>

                                <th>Mã khách hàng</th>

                                <td>{user.MaKhachHang}</td>

                            </tr>

                            <tr>

                                <th>Họ tên</th>

                                <td>{user.HoTen}</td>

                            </tr>

                            <tr>

                                <th>Email</th>

                                <td>{user.Email}</td>

                            </tr>

                            <tr>

                                <th>SĐT</th>

                                <td>{user.SoDienThoai}</td>

                            </tr>

                            <tr>

                                <th>Ngày sinh</th>

                                <td>{user.NgaySinh}</td>

                            </tr>

                            <tr>

                                <th>Giới tính</th>

                                <td>{user.GioiTinh}</td>

                            </tr>

                            <tr>

                                <th>Tổng điểm</th>

                                <td>{user.TongDiem}</td>

                            </tr>

                            <tr>

                                <th>Hạng thành viên</th>

                                <td>{getRankName(user.MaHangThanhVien)}</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

}

export default Profile;