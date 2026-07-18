export const CUSTOMER_USER_UPDATED_EVENT = "customer:user-updated";
export const AUTH_SESSION_CLEARED_EVENT = "auth:session-cleared";

const getStorageItem = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const removeAuthStorageItems = () => {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
    } catch {
        // Storage có thể bị trình duyệt chặn; phiên vẫn được xem là không hợp lệ trong bộ nhớ ứng dụng.
    }
};

export const getStoredAuthToken = () => getStorageItem("token");
export const getStoredAuthRole = () => getStorageItem("role");

export const getStoredCustomerUser = () => {
    try {
        return JSON.parse(getStorageItem("user"));
    } catch {
        return null;
    }
};

const dispatchBrowserEvent = (name, detail) => {
    if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;

    window.dispatchEvent(new CustomEvent(name, { detail }));
};

export const storeAuthSession = ({ token, role, user }) => {
    if (
        typeof token !== "string"
        || token.trim() === ""
        || typeof role !== "string"
        || role.trim() === ""
        || !user
        || typeof user !== "object"
    ) {
        return false;
    }

    try {
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(user));
        dispatchBrowserEvent(CUSTOMER_USER_UPDATED_EVENT, user);
        return true;
    } catch {
        removeAuthStorageItems();
        return false;
    }
};

export const clearAuthSession = () => {
    removeAuthStorageItems();
    dispatchBrowserEvent(CUSTOMER_USER_UPDATED_EVENT, null);
    dispatchBrowserEvent(AUTH_SESSION_CLEARED_EVENT, null);
};

export const updateStoredAuthToken = (token) => {
    if (typeof token !== "string" || token.trim() === "") return false;

    try {
        localStorage.setItem("token", token);
        return true;
    } catch {
        clearAuthSession();
        return false;
    }
};

export const syncStoredCustomerUser = (userPatch) => {
    if (!userPatch || typeof userPatch !== "object") return null;

    const currentUser = getStoredCustomerUser();
    const updatedUser = {
        ...(currentUser && typeof currentUser === "object" ? currentUser : {}),
        ...userPatch,
    };

    try {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatchBrowserEvent(CUSTOMER_USER_UPDATED_EVENT, updatedUser);
    } catch {
        return null;
    }

    return updatedUser;
};

export const syncStoredCustomerPoints = (pointPayload) => {
    const pointValue = Number(pointPayload?.TongDiem);
    if (!Number.isFinite(pointValue)) return null;

    const currentUser = getStoredCustomerUser();
    if (!currentUser || typeof currentUser !== "object") return null;

    return syncStoredCustomerUser({
        TongDiem: Math.max(0, pointValue),
        ...(pointPayload?.HangThanhVien
            ? { MaHangThanhVien: pointPayload.HangThanhVien }
            : {}),
    });
};
