import axiosClient from './axiosClient';
export const getWebSetting = () => axiosClient.get('/admin/web-setting');


export const updateWebSetting = (payload) =>
    axiosClient.put('/admin/web-setting', payload);

const webSettingApi = {
    get: getWebSetting,
    update: updateWebSetting,
};

export default webSettingApi;