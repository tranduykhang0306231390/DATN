import axiosClient from "./axiosClient";

export const getMyVoucher = (page = 1) => {
    return axiosClient.get("/member/my-vouchers", { params: { page } });

}

export const getHotVoucher = () => {
    return axiosClient.get("/member/voucher-hot");

}
