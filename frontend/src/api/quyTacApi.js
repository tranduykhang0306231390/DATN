// src/api/quyTacApi.js
import axiosClient from './axiosClient';

const quyTacApi = {
    // params: { search, trang_thai, per_page, page }
    getAll: (params) => axiosClient.get('/admin/quy-tac', { params }),
    getById: (ma) => axiosClient.get(`/admin/quy-tac/${ma}`),
    create: (payload) => axiosClient.post('/admin/quy-tac', payload),
    update: (ma, payload) => axiosClient.put(`/admin/quy-tac/${ma}`, payload),
    toggleTrangThai: (ma) => axiosClient.patch(`/admin/quy-tac/${ma}/trang-thai`),
};

export default quyTacApi;