export const getStoredObject = (key, fallback = {}) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "null");
        return value && typeof value === "object" && !Array.isArray(value)
            ? value
            : fallback;
    } catch {
        return fallback;
    }
};
