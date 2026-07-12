// src/api/hoaDonApi.js
import axiosClient from "./axiosClient";

const hoaDonApi = {
    getLoaiVe: () => axiosClient.get("/loai-ve"),
    lookupKhachHang: (soDienThoai) =>
        axiosClient.post("/khach-hang/lookup", {
            so_dien_thoai: soDienThoai,
        }),
    // Mở bàn / treo hóa đơn (payload có kèm so_ban)
    taoHoaDon: (payload) => axiosClient.post("/hoa-don", payload),
    chiTietHoaDon: (maHD) => axiosClient.get(`/hoa-don/${maHD}`),

    // Danh sách bàn đang treo (hóa đơn ChuaThanhToan)
    banDangTreo: () => axiosClient.get("/quan-ly-hoa-don/ban-dang-treo"),
    // Thanh toán hóa đơn treo -> chốt + tích điểm
    thanhToan: (maHD) => axiosClient.patch(`/hoa-don/${maHD}/thanh-toan`),
};

export default hoaDonApi;

export const quanLyHoaDonApi = {
    danhSach: (params) => axiosClient.get("/quan-ly-hoa-don", { params }),
    chiTiet: (maHD) => axiosClient.get(`/quan-ly-hoa-don/${maHD}`),
    
};