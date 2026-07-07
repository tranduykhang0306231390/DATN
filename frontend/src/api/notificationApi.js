import axiosClient from "./axiosClient";

export const getNotifications = () =>
    axiosClient.get("/member/notifications");

export const getUnreadCount = () =>
    axiosClient.get("/member/notifications/unread-count");

export const readAllNotifications = () =>
    axiosClient.patch("/member/notifications/read-all");