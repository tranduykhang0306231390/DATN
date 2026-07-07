import axiosClient from './axiosClient';

const lichSuQuyTacApi = {
    // params: { ma_quy_tac, per_page, page }
    getAll: (params) => axiosClient.get('/admin/lich-su-quy-tac', { params }),
};

export default lichSuQuyTacApi;