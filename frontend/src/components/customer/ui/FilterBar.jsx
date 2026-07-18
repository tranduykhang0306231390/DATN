function FilterBar({ children, actions = null, ariaLabel = "Bộ lọc", className = "" }) {
    return (
        <section
            className={`customer-filter-bar ${className}`.trim()}
            aria-label={ariaLabel}
        >
            <div className="customer-filter-bar__fields">{children}</div>
            {actions && <div className="customer-filter-bar__actions">{actions}</div>}
        </section>
    );
}

export default FilterBar;
