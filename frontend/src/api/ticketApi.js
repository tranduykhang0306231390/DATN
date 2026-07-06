import axiosClient from "./axiosClient";

export const getTickets = () => {
    return axiosClient.get("/member/tickets");
};
export const getHotTickets = () => {
    return axiosClient.get("/tickets/hot");
};
