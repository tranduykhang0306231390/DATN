const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api")
    .replace(/\/+$/, "");

const backendBaseUrl = apiBaseUrl.replace(/\/api$/, "");

export const getBackendAssetUrl = (path) => (
    `${backendBaseUrl}/${String(path || "").replace(/^\/+/, "")}`
);
