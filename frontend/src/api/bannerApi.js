// src/api/bannerApi.js
import axiosClient from './axiosClient';

export const getBanners = () => axiosClient.get('/banner');

const bannerApi = {
    getAll: () => axiosClient.get('/admin/banner'),
    create: (payload) => axiosClient.post('/admin/banner', payload),
    update: (ma, payload) => axiosClient.put(`/admin/banner/${ma}`, payload),
    toggle: (ma) => axiosClient.patch(`/admin/banner/${ma}/trang-thai`),
    remove: (ma) => axiosClient.delete(`/admin/banner/${ma}`),
};

export default bannerApi;