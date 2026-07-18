
import axiosClient from './axiosClient';

export const getWebSetting = () => axiosClient.get('/web-setting');


export const getWebSettingAdmin = () => axiosClient.get('/admin/web-setting');

export const updateWebSetting = (payload) =>
    axiosClient.put('/admin/web-setting', payload);

const webSettingApi = {
    get: getWebSetting,           
    getAdmin: getWebSettingAdmin, 
    update: updateWebSetting,
};

export default webSettingApi;