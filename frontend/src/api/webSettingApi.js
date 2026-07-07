import axiosClient from "./axiosClient";

export const getWebSetting = () => {
    return axiosClient.get("/web-setting");
};