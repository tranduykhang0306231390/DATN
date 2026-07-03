import axiosClient from "./axiosClient";

export const getTickets = () => {
    return axiosClient.get("/member/tickets");
};