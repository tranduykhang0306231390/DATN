// src/api/banAnApi.js
import axiosClient from './axiosClient';

const banAnApi = {
    // Danh sách cho màn mở bàn / đặt bàn (chỉ bàn HoatDong)
    getActive: () => axiosClient.get('/ban-an'),

    // Quản trị — params: { search, khu_vuc, trang_thai, per_page, page }
    getAll: (params) => axiosClient.get('/admin/ban-an', { params }),
    create: (payload) => axiosClient.post('/admin/ban-an', payload),
    update: (ma, payload) => axiosClient.put(`/admin/ban-an/${ma}`, payload),
    capNhatTrangThai: (ma, trangThai) =>
        axiosClient.patch(`/admin/ban-an/${ma}/trang-thai`, { TrangThai: trangThai }),
};

export default banAnApi;
