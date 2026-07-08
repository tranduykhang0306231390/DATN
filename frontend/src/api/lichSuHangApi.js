import axiosClient from './axiosClient';

const lichSuHangApi = {
    // params: { ma_khach_hang, per_page, page }
    getAll: (params) => axiosClient.get('/admin/lich-su-hang', { params }),
};

export default lichSuHangApi;