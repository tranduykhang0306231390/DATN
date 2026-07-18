export const MEMBER_ROLE = "member";
export const STAFF_ROLES = Object.freeze(["Admin", "NhanVien"]);
export const MEMBER_ACCOUNT_PATH = "/member/rank";

const LEGACY_MEMBER_REDIRECTS = Object.freeze({
    "/member": MEMBER_ACCOUNT_PATH,
    "/member/home": MEMBER_ACCOUNT_PATH,
    "/member/ticket": `${MEMBER_ACCOUNT_PATH}?tab=tickets`,
    "/member/voucher": `${MEMBER_ACCOUNT_PATH}?tab=vouchers`,
    "/member/invoice": `${MEMBER_ACCOUNT_PATH}?tab=transactions`,
});

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,20}$/;
export const MEMBER_NAME_PATTERN = /^[\p{L}\s]+$/u;
export const PHONE_PATTERN = /^0\d{9}$/;

export const isMemberRole = (role) => role === MEMBER_ROLE;
export const isStaffRole = (role) => STAFF_ROLES.includes(role);
export const isKnownRole = (role) => isMemberRole(role) || isStaffRole(role);

export const getRoleHomePath = (role) => {
    if (role === "Admin") return "/admin/dashboard";
    if (role === "NhanVien") return "/staff/dashboard";
    if (role === MEMBER_ROLE) return MEMBER_ACCOUNT_PATH;
    return null;
};

export const getRoleLoginPath = (role) => (
    isStaffRole(role) ? "/staff/login" : "/login"
);

export const getSafeMemberRedirect = (path) => {
    if (typeof path !== "string" || !/^\/member(?:\/|$)/.test(path)) {
        return MEMBER_ACCOUNT_PATH;
    }

    try {
        const url = new URL(path, "https://member.local");
        const pathname = url.pathname.length > 1
            ? url.pathname.replace(/\/+$/, "")
            : url.pathname;
        const legacyTarget = LEGACY_MEMBER_REDIRECTS[pathname];

        if (legacyTarget) return legacyTarget;
        if (pathname === MEMBER_ACCOUNT_PATH) {
            return `${MEMBER_ACCOUNT_PATH}${url.search}${url.hash}`;
        }
    } catch {
        return MEMBER_ACCOUNT_PATH;
    }

    return MEMBER_ACCOUNT_PATH;
};

export const normalizeFieldErrors = (error) => {
    const responseErrors = error?.response?.data?.errors;
    if (!responseErrors || typeof responseErrors !== "object") return {};

    return Object.fromEntries(
        Object.entries(responseErrors).flatMap(([field, messages]) => {
            const firstMessage = Array.isArray(messages) ? messages[0] : messages;
            return typeof firstMessage === "string" && firstMessage.trim()
                ? [[field, firstMessage.trim()]]
                : [];
        }),
    );
};

export const getAuthRequestMessage = (
    error,
    fallback = "Không thể hoàn tất yêu cầu lúc này. Vui lòng thử lại.",
) => {
    if (!error?.response) {
        return "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.";
    }

    const status = Number(error.response.status);
    if (status === 429) {
        return "Bạn đã thử quá nhiều lần. Vui lòng chờ một phút rồi thử lại.";
    }

    if (status >= 500) {
        return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
    }

    const message = error.response?.data?.message;
    return typeof message === "string" && message.trim() ? message.trim() : fallback;
};

export const getPasswordStrength = (password) => {
    if (!password) return { key: "empty", label: "", score: 0 };

    const score = [
        password.length >= 8 && password.length <= 20,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[@$!%*#?&]/.test(password),
    ].filter(Boolean).length;

    if (score <= 2) return { key: "weak", label: "Yếu", score: 1 };
    if (score <= 4) return { key: "medium", label: "Trung bình", score: 2 };
    return { key: "strong", label: "Mạnh", score: 3 };
};
