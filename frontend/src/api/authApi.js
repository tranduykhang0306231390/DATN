import axios from "axios";
import axiosClient from "./axiosClient";

const API_URL = "http://127.0.0.1:8000/api";

/* AUTH */
export const staffLogin = (data) => {
    return axios.post(`${API_URL}/staff/login`, data);
};

export const memberLogin = (data) => {
    return axios.post(`${API_URL}/member/login`, data);
};

export const registerMember = (data) => {
    return axios.post(`${API_URL}/member/register`, data);
};

/* PROFILE */
export const getMemberProfile = () => {
    return axiosClient.get("/member/profile");
};

export const getStaffProfile = () => {
    return axiosClient.get("/staff/profile");
};

/* POINTS */
export const getMemberPoints = () => {
    return axiosClient.get("/member/points");
};

export const getPointHistory = (params = {}) => {
    return axiosClient.get("/member/history", {
        params
    });
};

/* BANNER */
export const getBanner = () => {
    return axiosClient.get("/banner");
};

/* TICKET */
export const getTickets = () => {
    return axiosClient.get("/member/tickets");
};

export const getHotTickets = () => {
    return axiosClient.get("/member/tickets/hot");
};

/* VOUCHER */
export const getMyVoucher = (page = 1) => {
    return axiosClient.get("/member/my-vouchers", {
        params: {
            page
        }
    });
};

export const getVoucherStore = () => {
    return axiosClient.get("/member/voucher-store");
};

export const exchangeVoucher = (MaUuDai) => {
    return axiosClient.post("/member/exchange-voucher", { MaUuDai });
};

export const getHotVoucher = () => {
    return axiosClient.get("/member/voucher-hot");
};

/* PROFILE UPDATE */
export const updateMemberProfile = (data) => {
    return axiosClient.put("/member/profile", data);
};

/* CHANGE PASSWORD */
export const changePassword = (data) => {
    return axiosClient.put("/member/change-password", data);
};

/* FEEDBACK */
export const getInvoiceFeedback = (maHoaDon) => {
    return axiosClient.get(`/member/invoices/${maHoaDon}/feedback`);
};

export const sendInvoiceFeedback = (maHoaDon, data) => {
    return axiosClient.post(`/member/invoices/${maHoaDon}/feedback`, data);
};

/* RANK HISTORY - lịch sử thăng hạng thành viên */
export const getRankHistory = () => {
    return axiosClient.get("/member/rank-history");
};
export const forgotPassword = (data) => {
    return axios.post(`${API_URL}/member/forgot-password`, data);
};

export const resetPassword = (data) => {
    return axios.post(`${API_URL}/member/reset-password`, data);
};