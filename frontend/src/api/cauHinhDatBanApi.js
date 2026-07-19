// src/api/cauHinhDatBanApi.js
import axiosClient from './axiosClient';

const cauHinhDatBanApi = {
    get: () => axiosClient.get('/admin/cau-hinh-dat-ban'),
    update: (payload) => axiosClient.put('/admin/cau-hinh-dat-ban', payload),
};

export default cauHinhDatBanApi;
