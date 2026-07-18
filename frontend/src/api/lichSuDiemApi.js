import axiosClient from './axiosClient';
 
const lichSuDiemApi = {
    // params: { ma_khach_hang, loai_giao_dich, per_page, page }
    getAll: (params) => axiosClient.get('/admin/lich-su-diem', { params }),
};
 
export default lichSuDiemApi;