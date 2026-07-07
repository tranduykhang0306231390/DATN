// src/api/hangThanhVienApi.js
import axiosClient from './axiosClient';

const hangThanhVienApi = {
    // params: { search, per_page, page }
    getAll: (params) => axiosClient.get('/admin/hang-thanh-vien', { params }),
    getOptions: () => axiosClient.get('/admin/hang-thanh-vien/tuy-chon'),
    getById: (ma) => axiosClient.get(`/admin/hang-thanh-vien/${ma}`),
    create: (payload) => axiosClient.post('/admin/hang-thanh-vien', payload),
    update: (ma, payload) => axiosClient.put(`/admin/hang-thanh-vien/${ma}`, payload),
    remove: (ma) => axiosClient.delete(`/admin/hang-thanh-vien/${ma}`),
};

export default hangThanhVienApi;