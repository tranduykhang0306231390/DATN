// src/api/hoaDonApi.js
import axiosClient from "./axiosClient";

const hoaDonApi = {
    /** Lấy danh sách loại vé */
    getLoaiVe: () => axiosClient.get("/staff/loai-ve"),

    /** Tra cứu KH + voucher theo số điện thoại */
    lookupKhachHang: (soDienThoai) =>
        axiosClient.post("/staff/khach-hang/lookup", {
            so_dien_thoai: soDienThoai,
        }),

    /** Tạo hóa đơn */
    taoHoaDon: (payload) =>
        axiosClient.post("/staff/hoa-don", payload),

    /** Xem chi tiết hóa đơn */
    chiTietHoaDon: (maHD) =>
        axiosClient.get(`/staff/hoa-don/${maHD}`),
};

export default hoaDonApi;