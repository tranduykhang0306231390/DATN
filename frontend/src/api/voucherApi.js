import axiosClient from "./axiosClient";

export const getMyVoucher=()=>{

    return axiosClient.get("/member/vouchers");

}

export const getHotVoucher=()=>{

    return axiosClient.get("/member/vouchers/hot");

}