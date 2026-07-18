
import axiosClient from './axiosClient';

export const getWebSetting = () => axiosClient.get('/web-setting');


export const getWebSettingAdmin = () => axiosClient.get('/admin/web-setting');

// Laravel không đọc được file upload trên PUT thật (giới hạn của PHP với
// multipart/form-data), nên gửi bằng POST kèm _method=PUT để giả lập.
export const updateWebSetting = (formData) => {
    formData.append('_method', 'PUT');
    return axiosClient.post('/admin/web-setting', formData);
};

const webSettingApi = {
    get: getWebSetting,           
    getAdmin: getWebSettingAdmin, 
    update: updateWebSetting,
};

export default webSettingApi;