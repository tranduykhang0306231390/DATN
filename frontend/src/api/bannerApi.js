// src/api/bannerApi.js
import axiosClient from './axiosClient';

export const getBanners = () => axiosClient.get('/banner');

const bannerApi = {
    getAll: () => axiosClient.get('/admin/banner'),
    create: (formData) => axiosClient.post('/admin/banner', formData),
    // Laravel không đọc được file upload trên PUT thật (giới hạn của PHP với
    // multipart/form-data), nên gửi bằng POST kèm _method=PUT để giả lập.
    update: (ma, formData) => {
        formData.append('_method', 'PUT');
        return axiosClient.post(`/admin/banner/${ma}`, formData);
    },
    toggle: (ma) => axiosClient.patch(`/admin/banner/${ma}/trang-thai`),
    remove: (ma) => axiosClient.delete(`/admin/banner/${ma}`),
};

export default bannerApi;