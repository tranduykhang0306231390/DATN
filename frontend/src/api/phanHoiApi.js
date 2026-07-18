// src/api/phanHoiApi.js
import axiosClient from './axiosClient';

const phanHoiApi = {
    // params: { search, trang_thai, diem, per_page, page }
    getAll: (params) => axiosClient.get('/admin/phan-hoi', { params }),
    getById: (ma) => axiosClient.get(`/admin/phan-hoi/${ma}`),
    traLoi: (ma, payload) => axiosClient.patch(`/admin/phan-hoi/${ma}/tra-loi`, payload),
};

export default phanHoiApi;