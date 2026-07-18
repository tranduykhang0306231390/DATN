function LoadingSkeleton({ lines = 3, ariaLabel = "Đang tải dữ liệu", className = "" }) {
    const lineCount = Math.min(8, Math.max(1, Number(lines) || 1));

    return (
        <div
            className={`customer-loading-skeleton ${className}`.trim()}
            role="status"
            aria-live="polite"
        >
            <span className="customer-visually-hidden">{ariaLabel}</span>
            <div className="customer-loading-skeleton__content" aria-hidden="true">
                {Array.from({ length: lineCount }, (_, index) => (
                    <span key={index} className="customer-loading-skeleton__line" />
                ))}
            </div>
        </div>
    );
}

export default LoadingSkeleton;
