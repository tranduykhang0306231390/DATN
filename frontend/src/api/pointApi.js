import axiosClient from "./axiosClient";

export const getPointInfo = () => {
    return axiosClient.get("/member/points");
};

export const getPointHistory = (page = 1) => {
    return axiosClient.get(`/member/history?page=${page}`);
};