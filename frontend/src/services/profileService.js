import axiosClient from "../api/axiosClient";

export const getStaffProfile = () => {
    return axiosClient.get(
        "/profile"
    );
};

export const getMemberProfile = () => {
    return axiosClient.get(
        "/member/profile"
    );
};
