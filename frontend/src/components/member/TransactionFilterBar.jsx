import { useState } from "react";
import { FaChevronDown, FaFilter } from "react-icons/fa";

function TransactionFilterBar({
    children,
    actions = null,
    ariaLabel = "Bộ lọc giao dịch",
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const panelId = `transaction-filter-${ariaLabel
        .toLocaleLowerCase("vi-VN")
        .replace(/[^a-z0-9]+/g, "-")}`;

    return (
        <section className="transaction-filter-bar" aria-label={ariaLabel}>
            <button
                type="button"
                className="transaction-filter-bar__toggle"
                aria-expanded={mobileOpen}
                aria-controls={panelId}
                onClick={() => setMobileOpen((current) => !current)}
            >
                <FaFilter aria-hidden="true" />
                <span>Bộ lọc</span>
                <FaChevronDown aria-hidden="true" />
            </button>

            <div
                id={panelId}
                className={`transaction-filter-bar__panel ${mobileOpen ? "is-open" : ""}`}
            >
                <div className="transaction-filter-bar__fields">{children}</div>
                {actions && <div className="transaction-filter-bar__actions">{actions}</div>}
            </div>
        </section>
    );
}

export default TransactionFilterBar;
