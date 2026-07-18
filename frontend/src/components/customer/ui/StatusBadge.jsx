function StatusBadge({ children, tone = "neutral", icon = null, className = "" }) {
    return (
        <span
            className={`customer-status-badge customer-status-badge--${tone} ${className}`.trim()}
        >
            {icon && (
                <span className="customer-status-badge__icon" aria-hidden="true">
                    {icon}
                </span>
            )}
            <span>{children}</span>
        </span>
    );
}

export default StatusBadge;
