import { FaGift, FaWallet } from "react-icons/fa";

const TABS = [
    { key: "store", label: "Kho Voucher", icon: FaGift },
    { key: "mine", label: "Voucher của tôi", icon: FaWallet },
];

function VoucherTabs({ activeTab, storeCount, ownedCount, onTabChange }) {
    const counts = { store: storeCount, mine: ownedCount };

    return (
        <div className="reward-voucher-tabs" role="tablist" aria-label="Khu vực voucher">
            {TABS.map(({ key, label, icon: Icon }) => {
                const isActive = activeTab === key;
                const count = counts[key];
                const hasCount = Number.isFinite(Number(count));

                return (
                    <button
                        key={key}
                        id={`voucher-tab-${key}`}
                        type="button"
                        role="tab"
                        className={`reward-voucher-tabs__button ${isActive ? "is-active" : ""}`}
                        aria-selected={isActive}
                        aria-controls={`voucher-panel-${key}`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onTabChange?.(key)}
                    >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                        {hasCount && <strong aria-label={`${Number(count)} voucher`}>{Number(count)}</strong>}
                    </button>
                );
            })}
        </div>
    );
}

export default VoucherTabs;
