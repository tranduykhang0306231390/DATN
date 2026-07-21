import axiosClient from "./axiosClient";

const staffKhachHangApi = {
    checkPhone: (SoDienThoai) => axiosClient.post("/khach-hang/dang-ky/kiem-tra-so-dien-thoai", { SoDienThoai }),
    register: (data) => axiosClient.post("/khach-hang/dang-ky", data),
};

export default staffKhachHangApi;
