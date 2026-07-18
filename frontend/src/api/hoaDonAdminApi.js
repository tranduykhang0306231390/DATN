import axiosClient from './axiosClient';

const hoaDonAdminApi = {
    getAll: (params) => axiosClient.get('/quan-ly-hoa-don', { params }),
    getById: (maHD) => axiosClient.get(`/quan-ly-hoa-don/${maHD}`),
    huyBan: (maHD) => axiosClient.patch(`/hoa-don/${maHD}/huy-ban`),
    huyDaThanhToan: (maHD, lyDo) => axiosClient.patch(`/admin/hoa-don/${maHD}/huy`, { ly_do: lyDo || null }),
};

export default hoaDonAdminApi;