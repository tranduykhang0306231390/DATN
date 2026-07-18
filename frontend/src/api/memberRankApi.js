import axiosClient from "./axiosClient";

export const getMemberRanks = () => axiosClient.get("/member/ranks");

const memberRankApi = {
    getAll: getMemberRanks,
};

export default memberRankApi;
