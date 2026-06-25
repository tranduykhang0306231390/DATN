import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const staffLogin = (data) => {
  return axios.post(`${API_URL}/staff/login`, data);
};

export const memberLogin = (data) => {
  return axios.post(`${API_URL}/member/login`, data);
};
export const registerMember = (data) => {
    return axios.post(
        "http://127.0.0.1:8000/api/member/register",
        data
    );
};