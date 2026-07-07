// src/api/uuDaiApi.js
import axiosClient from './axiosClient';

const uuDaiApi = {
    // params: { search, trang_thai, nhom, hang, per_page, page }
    getAll: (params) => axiosClient.get('/admin/uu-dai', { params }),
    getOptions: () => axiosClient.get('/admin/uu-dai/tuy-chon'),
    getById: (ma) => axiosClient.get(`/admin/uu-dai/${ma}`),
    create: (payload) => axiosClient.post('/admin/uu-dai', payload),
    update: (ma, payload) => axiosClient.put(`/admin/uu-dai/${ma}`, payload),
    toggleTrangThai: (ma) => axiosClient.patch(`/admin/uu-dai/${ma}/trang-thai`),
};

export default uuDaiApi;