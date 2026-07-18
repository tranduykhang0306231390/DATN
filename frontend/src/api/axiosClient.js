import axios from "axios";
import { getRoleLoginPath } from "../utils/auth";
import {
    clearAuthSession,
    getStoredAuthRole,
    getStoredAuthToken,
} from "../utils/customerSession";

let redirectInProgress = false;

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
});

axiosClient.interceptors.request.use(
    (config) => {

        const token = getStoredAuthToken();

        if(token){

            config.headers.Authorization =
                `Bearer ${token}`;

        }

        return config;
    }
);

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestHeaders = error.config?.headers;
        const authorizationHeader = typeof requestHeaders?.get === "function"
            ? requestHeaders.get("Authorization")
            : requestHeaders?.Authorization || requestHeaders?.authorization;

        // A 401 from login means invalid credentials, not an expired session.
        // Only requests that actually carried the stored bearer token may trigger logout.
        if (error.response?.status === 401 && authorizationHeader) {
            const role = getStoredAuthRole();
            const loginPath = getRoleLoginPath(role);
            clearAuthSession();

            if (!redirectInProgress && window.location.pathname !== loginPath) {
                redirectInProgress = true;
                window.location.assign(loginPath);
            }
        }

        return Promise.reject(error);
    },
);

export default axiosClient;
