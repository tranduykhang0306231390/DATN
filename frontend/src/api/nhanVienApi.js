// src/api/nhanVienApi.js
import axiosClient from './axiosClient';

const nhanVienApi = {
    // params: { search, vai_tro, trang_thai, per_page, page }
    getAll: (params) => axiosClient.get('/admin/nhan-vien', { params }),
    getById: (ma) => axiosClient.get(`/admin/nhan-vien/${ma}`),
    create: (payload) => axiosClient.post('/admin/nhan-vien', payload),
    update: (ma, payload) => axiosClient.put(`/admin/nhan-vien/${ma}`, payload),
    toggleTrangThai: (ma) => axiosClient.patch(`/admin/nhan-vien/${ma}/trang-thai`),
};

export default nhanVienApi;
