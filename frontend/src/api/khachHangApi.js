import axiosClient from './axiosClient';

const khachHangApi = {
    // params: { search, hang, trang_thai, per_page, page }
    getAll: (params) => axiosClient.get('/admin/khach-hang', { params }),
    getOptions: () => axiosClient.get('/admin/khach-hang/tuy-chon'),
    getById: (ma) => axiosClient.get(`/admin/khach-hang/${ma}`),
    update: (ma, payload) => axiosClient.put(`/admin/khach-hang/${ma}`, payload),
    toggleTrangThai: (ma) => axiosClient.patch(`/admin/khach-hang/${ma}/trang-thai`),
};

export default khachHangApi;