// src/api/loaiVeApi.js
import axiosClient from './axiosClient';

const loaiVeApi = {
    // Danh sách cho màn tạo hóa đơn (chỉ vé HoatDong)
    getActive: () => axiosClient.get('/loai-ve'),

    // Quản trị — params: { search, buoi_an, loai_ngay, trang_thai, per_page, page }
    getAll: (params) => axiosClient.get('/admin/loai-ve', { params }),
    create: (payload) => axiosClient.post('/admin/loai-ve', payload),
    update: (ma, payload) => axiosClient.put(`/admin/loai-ve/${ma}`, payload),
    toggleTrangThai: (ma) => axiosClient.patch(`/admin/loai-ve/${ma}/trang-thai`),
};

export default loaiVeApi;