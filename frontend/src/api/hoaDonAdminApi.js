import axiosClient from './axiosClient';

const hoaDonAdminApi = {
    getAll: (params) => axiosClient.get('/quan-ly-hoa-don', { params }),
    getById: (maHD) => axiosClient.get(`/quan-ly-hoa-don/${maHD}`),
};

export default hoaDonAdminApi;