import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const staffLogin = async (data) => {
    return axios.post(
        `${API_URL}/staff/login`,
        data
    );
};

export const memberLogin = async (data) => {
    return axios.post(
        `${API_URL}/member/login`,
        data
    );
};