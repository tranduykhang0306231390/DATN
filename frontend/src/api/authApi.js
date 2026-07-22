import axios from "axios";
import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

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

export const checkPhoneAvailable = (SoDienThoai) => {
    return axios.post(`${API_URL}/member/register/check-phone`, { SoDienThoai });
};

export const memberLoginFirebase = (FirebaseIdToken) => {
    return axios.post(`${API_URL}/member/login/firebase`, { FirebaseIdToken });
};

/* PROFILE */
export const getMemberProfile = () => {
    return axiosClient.get("/member/profile");
};

export const getStaffProfile = () => {
    return axiosClient.get("/profile");
};

/* ADMIN: cấu hình tài khoản của chính mình (họ tên, tên đăng nhập, mật khẩu) */
export const updateStaffAccount = (data) => {
    return axiosClient.put("/profile", data);
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

export const getVoucherStore = (page = 1) => {
    return axiosClient.get("/member/voucher-store", {
        params: { page }
    });
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

/* CHANGE PASSWORD (2 bước: xác minh OTP Firebase rồi mới xác nhận mật khẩu mới) */
export const requestChangePasswordVerification = (FirebaseIdToken) => {
    return axiosClient.post("/member/change-password/verify-phone", { FirebaseIdToken });
};

export const confirmChangePassword = (data) => {
    return axiosClient.post("/member/change-password/confirm", data);
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

export const logoutSession = () => axiosClient.post("/logout");
