// src/api/thongBaoApi.js
import axiosClient from './axiosClient';

const thongBaoApi = {
    getAll: (params) => axiosClient.get('/admin/thong-bao', { params }),
    getOptions: () => axiosClient.get('/admin/thong-bao/tuy-chon'),
    send: (payload) => axiosClient.post('/admin/thong-bao', payload),
};

export default thongBaoApi;