function EmptyState({
    title = "Chưa có dữ liệu",
    description,
    icon = null,
    action = null,
    as: HeadingTag = "h2",
    className = "",
}) {
    return (
        <section className={`customer-state customer-state--empty ${className}`.trim()}>
            {icon && (
                <div className="customer-state__icon" aria-hidden="true">
                    {icon}
                </div>
            )}
            <HeadingTag className="customer-state__title">{title}</HeadingTag>
            {description && <p className="customer-state__description">{description}</p>}
            {action && <div className="customer-state__action">{action}</div>}
        </section>
    );
}

export default EmptyState;
