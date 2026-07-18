function SectionHeading({
    eyebrow,
    title,
    description,
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
                {eyebrow && <span className="customer-section-heading__eyebrow">{eyebrow}</span>}
                <HeadingTag id={id} className="customer-section-heading__title">
                    {title}
                </HeadingTag>
                {description && (
                    <p className="customer-section-heading__description">{description}</p>
                )}
            </div>
            {action && <div className="customer-section-heading__action">{action}</div>}
        </div>
    );
}

export default SectionHeading;
