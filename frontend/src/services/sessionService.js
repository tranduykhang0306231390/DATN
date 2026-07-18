import { getMemberProfile, getStaffProfile } from "../api/authApi";
import {
    clearAuthSession,
    getStoredAuthRole,
    getStoredAuthToken,
    syncStoredCustomerUser,
} from "../utils/customerSession";
import { isKnownRole, isMemberRole, isStaffRole, MEMBER_ROLE } from "../utils/auth";

let verifiedKey = null;
let verifiedResult = null;
let pendingKey = null;
let pendingVerification = null;

const getSessionKey = (token, role) => `${role}:${token}`;

export const resetSessionVerificationCache = () => {
    verifiedKey = null;
    verifiedResult = null;
    pendingKey = null;
    pendingVerification = null;
};

const persistVerifiedUser = (role, user) => {
    if (isMemberRole(role)) {
        return Boolean(syncStoredCustomerUser(user));
    }

    try {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", role);
        return true;
    } catch {
        clearAuthSession();
        return false;
    }
};

const performVerification = async (token, storedRole) => {
    try {
        const response = isMemberRole(storedRole)
            ? await getMemberProfile()
            : await getStaffProfile();
        const user = response.data?.user;

        if (!user || typeof user !== "object" || getStoredAuthToken() !== token) {
            return { status: "unauthenticated", role: null, user: null };
        }

        const verifiedRole = isMemberRole(storedRole)
            ? MEMBER_ROLE
            : user.VaiTro;

        if (!isKnownRole(verifiedRole) || (isStaffRole(storedRole) && !isStaffRole(verifiedRole))) {
            clearAuthSession();
            return { status: "unauthenticated", role: null, user: null };
        }

        if (!persistVerifiedUser(verifiedRole, user)) {
            return { status: "unauthenticated", role: null, user: null };
        }

        return {
            status: "authenticated",
            role: verifiedRole,
            user,
        };
    } catch (error) {
        const status = Number(error?.response?.status);

        if (status === 401 || status === 403) {
            clearAuthSession();
            return {
                status: "unauthenticated",
                role: null,
                user: null,
                reason: status === 403 ? "inactive" : "expired",
            };
        }

        return {
            status: "unavailable",
            role: storedRole,
            user: null,
        };
    }
};

export const verifyStoredSession = ({ force = false } = {}) => {
    const token = getStoredAuthToken();
    const role = getStoredAuthRole();

    if (!token || !isKnownRole(role)) {
        if (token || role) clearAuthSession();
        return Promise.resolve({ status: "unauthenticated", role: null, user: null });
    }

    const key = getSessionKey(token, role);

    if (!force && verifiedKey === key && verifiedResult) {
        return Promise.resolve(verifiedResult);
    }

    if (!force && pendingKey === key && pendingVerification) {
        return pendingVerification;
    }

    pendingKey = key;
    pendingVerification = performVerification(token, role).then((result) => {
        if (result.status === "authenticated") {
            const currentToken = getStoredAuthToken();
            const currentRole = getStoredAuthRole();
            verifiedKey = currentToken && currentRole
                ? getSessionKey(currentToken, currentRole)
                : null;
            verifiedResult = verifiedKey ? result : null;
        }

        if (pendingKey === key) {
            pendingKey = null;
            pendingVerification = null;
        }

        return result;
    });

    return pendingVerification;
};
