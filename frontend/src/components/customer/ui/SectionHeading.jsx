function SectionHeading({
    title,
    action,
    align = "start",
    as: HeadingTag = "h2",
    id,
    className = "",
}) {
    return (
        <div
            className={`customer-section-heading customer-section-heading--${align} ${className}`.trim()}
        >
            <div className="customer-section-heading__content">
                <HeadingTag id={id} className="customer-section-heading__title">
                    {title}
                </HeadingTag>
            </div>
            {action && <div className="customer-section-heading__action">{action}</div>}
        </div>
    );
}

export default SectionHeading;
