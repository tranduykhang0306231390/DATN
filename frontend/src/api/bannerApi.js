import axiosClient from "./axiosClient";

export const getBanners = () => {
    return axiosClient.get("/banner");
};