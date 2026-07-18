// src/api/hoaDonApi.js
import axiosClient from "./axiosClient";

const hoaDonApi = {
    getLoaiVe: () => axiosClient.get("/loai-ve"),
    lookupKhachHang: (soDienThoai) =>
        axiosClient.post("/khach-hang/lookup", { so_dien_thoai: soDienThoai }),

    // Danh sách bàn đang phục vụ
    banDangTreo: () => axiosClient.get("/quan-ly-hoa-don/ban-dang-treo"),

    // 1. Mở bàn: { so_ban, chi_tiet }
    moBan: (payload) => axiosClient.post("/hoa-don", payload),

    // 2. Gọi thêm: { chi_tiet }
    themMon: (maHD, payload) => axiosClient.post(`/hoa-don/${maHD}/them-mon`, payload),

    // 3. Đổi bàn: { so_ban_moi }
    doiBan: (maHD, soBanMoi) =>
        axiosClient.patch(`/hoa-don/${maHD}/doi-ban`, { so_ban_moi: soBanMoi }),

    // 4. Hủy bàn
    huyBan: (maHD) => axiosClient.patch(`/hoa-don/${maHD}/huy-ban`),

    // 5. Ước tính trước khi thanh toán: { ma_khach_hang, vouchers_ap_dung }
    uocTinh: (maHD, payload) => axiosClient.post(`/hoa-don/${maHD}/uoc-tinh`, payload),

    // 6. Thanh toán: { ma_khach_hang, vouchers_ap_dung }
    thanhToan: (maHD, payload) => axiosClient.patch(`/hoa-don/${maHD}/thanh-toan`, payload),

    chiTietHoaDon: (maHD) => axiosClient.get(`/hoa-don/${maHD}`),
};

export default hoaDonApi;

export const quanLyHoaDonApi = {
    danhSach: (params) => axiosClient.get("/quan-ly-hoa-don", { params }),
    chiTiet: (maHD) => axiosClient.get(`/quan-ly-hoa-don/${maHD}`),
};
