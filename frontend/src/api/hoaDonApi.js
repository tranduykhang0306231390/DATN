// src/api/hoaDonApi.js
import axiosClient from "./axiosClient";

const hoaDonApi = {
    getLoaiVe: () => axiosClient.get("/loai-ve"),
    lookupKhachHang: (soDienThoai) =>
        axiosClient.post("/khach-hang/lookup", {
            so_dien_thoai: soDienThoai,
        }),
    taoHoaDon: (payload) => axiosClient.post("/hoa-don", payload),
    chiTietHoaDon: (maHD) => axiosClient.get(`/hoa-don/${maHD}`),
};

export default hoaDonApi;

export const quanLyHoaDonApi = {
    danhSach: (params) => axiosClient.get("/quan-ly-hoa-don", { params }),

    chiTiet: (maHD) => axiosClient.get(`/quan-ly-hoa-don/${maHD}`),

    huy: (maHD) => axiosClient.patch(`/quan-ly-hoa-don/${maHD}/huy`),
};