export const ACCOUNT_TABS = Object.freeze([
    "rank",
    "tickets",
    "vouchers",
    "my-vouchers",
    "transactions",
]);

export const ACCOUNT_MODALS = Object.freeze(["profile", "password"]);

export const normalizeAccountTab = (value) => (
    ACCOUNT_TABS.includes(value) ? value : "rank"
);

export const normalizeAccountModal = (value, tab = "rank") => (
    tab === "rank" && ACCOUNT_MODALS.includes(value) ? value : null
);

export const getAccountNavigationKey = (tab) => {
    const normalizedTab = normalizeAccountTab(tab);
    return normalizedTab === "my-vouchers" ? "vouchers" : normalizedTab;
};

export const getAccountSearch = ({ tab = "rank", modal = null } = {}) => {
    const normalizedTab = normalizeAccountTab(tab);
    const normalizedModal = normalizeAccountModal(modal, normalizedTab);
    const params = new URLSearchParams({ tab: normalizedTab });

    if (normalizedModal) params.set("modal", normalizedModal);
    return `?${params.toString()}`;
};
