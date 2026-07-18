import axiosClient from './axiosClient';

const hoaDonAdminApi = {
    getAll: (params) => axiosClient.get('/quan-ly-hoa-don', { params }),
    getById: (maHD) => axiosClient.get(`/quan-ly-hoa-don/${maHD}`),
    huyBan: (maHD) => axiosClient.patch(`/hoa-don/${maHD}/huy-ban`),
};

export default hoaDonAdminApi;