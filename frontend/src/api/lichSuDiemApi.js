import axiosClient from './axiosClient';
 
const lichSuDiemApi = {
    // params: { keyword, loai_giao_dich, per_page, page }
    getAll: (params) => axiosClient.get('/admin/lich-su-diem', { params }),
};
 
export default lichSuDiemApi;