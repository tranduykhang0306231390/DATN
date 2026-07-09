import axiosClient from './axiosClient';

const hoaDonAdminApi = {
    getAll: (params) => axiosClient.get('/quan-ly-hoa-don', { params }),
    getById: (maHD) => axiosClient.get(`/quan-ly-hoa-don/${maHD}`),
    huy: (maHD) => axiosClient.patch(`/quan-ly-hoa-don/${maHD}/huy`),
};

export default hoaDonAdminApi;