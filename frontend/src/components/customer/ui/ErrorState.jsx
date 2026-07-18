function ErrorState({
    title = "Không thể tải dữ liệu",
    description = "Vui lòng thử lại sau.",
    icon = null,
    onRetry,
    retryLabel = "Thử lại",
    as: HeadingTag = "h2",
    className = "",
}) {
    return (
        <section
            className={`customer-state customer-state--error ${className}`.trim()}
            role="alert"
        >
            {icon && (
                <div className="customer-state__icon" aria-hidden="true">
                    {icon}
                </div>
            )}
            <HeadingTag className="customer-state__title">{title}</HeadingTag>
            {description && <p className="customer-state__description">{description}</p>}
            {onRetry && (
                <button
                    type="button"
                    className="customer-button customer-button--primary"
                    onClick={onRetry}
                >
                    {retryLabel}
                </button>
            )}
        </section>
    );
}

export default ErrorState;
