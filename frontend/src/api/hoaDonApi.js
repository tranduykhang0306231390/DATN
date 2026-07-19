// src/api/hoaDonApi.js
import axiosClient from "./axiosClient";

const hoaDonApi = {
    // Danh sách loại vé đang áp dụng
    getLoaiVe: () =>
        axiosClient.get("/loai-ve"),

    // Tra cứu khách hàng bằng số điện thoại
    lookupKhachHang: (soDienThoai) =>
        axiosClient.post("/khach-hang/lookup", {
            so_dien_thoai: soDienThoai,
        }),

    // Danh sách bàn đang phục vụ
    banDangTreo: () =>
        axiosClient.get(
            "/quan-ly-hoa-don/ban-dang-treo"
        ),

    // 1. Mở bàn: { so_ban, chi_tiet }
    moBan: (payload) =>
        axiosClient.post("/hoa-don", payload),

    // 2. Gọi thêm: { chi_tiet }
    themMon: (maHD, payload) =>
        axiosClient.post(
            `/hoa-don/${maHD}/them-mon`,
            payload
        ),

    // 3. Đổi bàn: { so_ban_moi }
    doiBan: (maHD, soBanMoi) =>
        axiosClient.patch(
            `/hoa-don/${maHD}/doi-ban`,
            {
                so_ban_moi: soBanMoi,
            }
        ),

    // 4. Hủy bàn đang phục vụ
    huyBan: (maHD) =>
        axiosClient.patch(
            `/hoa-don/${maHD}/huy-ban`
        ),

    // 5. Ước tính trước khi thanh toán
    // { ma_khach_hang, vouchers_ap_dung }
    uocTinh: (maHD, payload = {}) =>
        axiosClient.post(
            `/hoa-don/${maHD}/uoc-tinh`,
            payload
        ),

    // 6. Thanh toán
    // { ma_khach_hang, vouchers_ap_dung,
    //   continue_without_invalid_vouchers }
    thanhToan: (maHD, payload = {}) =>
        axiosClient.patch(
            `/hoa-don/${maHD}/thanh-toan`,
            payload
        ),

    // Chi tiết hóa đơn
    chiTietHoaDon: (maHD) =>
        axiosClient.get(`/hoa-don/${maHD}`),
};

export default hoaDonApi;

export const quanLyHoaDonApi = {
    // Danh sách hóa đơn có lọc và phân trang
    danhSach: (params = {}) =>
        axiosClient.get("/quan-ly-hoa-don", {
            params,
        }),

    // Chi tiết hóa đơn trong trang quản lý
    chiTiet: (maHD) =>
        axiosClient.get(
            `/quan-ly-hoa-don/${maHD}`
        ),
};