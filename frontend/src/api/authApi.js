import axios from "axios";
import axiosClient from "./axiosClient";

const API_URL = "http://127.0.0.1:8000/api";

export const staffLogin = (data) => {
    return axios.post(`${API_URL}/staff/login`, data);
};

export const memberLogin = (data) => {
    return axios.post(`${API_URL}/member/login`, data);
};

export const registerMember = (data) => {
    return axios.post(`${API_URL}/member/register`, data);
};

export const getMemberProfile = () => {
    return axiosClient.get("/member/profile");
};

export const getStaffProfile = () => {
    return axiosClient.get("/staff/profile");
};
export const getMemberPoints = () => {
    return axiosClient.get("/member/points");
};
export const getPointHistory = (page = 1) => {
    return axiosClient.get(`/member/history?page=${page}`);
};