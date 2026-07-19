// src/api/thongKeApi.js
import axiosClient from './axiosClient';

const thongKeApi = {
    tongQuan: () => axiosClient.get('/admin/thong-ke/tong-quan'),
    chiTiet: (params) => axiosClient.get('/admin/thong-ke/chi-tiet', { params }),
    datBan: (params) => axiosClient.get('/admin/thong-ke/dat-ban', { params }),
};

export default thongKeApi;