// src/api/staffDatBanApi.js
import axiosClient from './axiosClient';

const staffDatBanApi = {
    // params: { trang_thai, ngay, per_page, page }
    getAll: (params) => axiosClient.get('/dat-ban', { params }),

    xacNhan: (ma, maBan) =>
        axiosClient.patch(`/dat-ban/${ma}/xac-nhan`, { MaBan: maBan }),

    tuChoi: (ma, lyDo) =>
        axiosClient.patch(`/dat-ban/${ma}/tu-choi`, { ly_do: lyDo }),

    checkin: (ma, chiTiet) =>
        axiosClient.post(`/dat-ban/${ma}/checkin`, { chi_tiet: chiTiet }),

    // params: { per_page, page }
    getCanHoanCoc: (params) => axiosClient.get('/dat-ban/can-hoan-coc', { params }),

    danhDauHoanTien: (ma) => axiosClient.patch(`/dat-ban/${ma}/danh-dau-hoan-tien`),
};

export default staffDatBanApi;
