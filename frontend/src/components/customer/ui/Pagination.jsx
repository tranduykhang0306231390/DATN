const buildPageItems = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const candidates = [...new Set([
        1,
        totalPages,
        currentPage - 1,
        currentPage,
        currentPage + 1,
    ])]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((left, right) => left - right);

    const items = [];

    candidates.forEach((page, index) => {
        const previousPage = candidates[index - 1];

        if (previousPage && page - previousPage === 2) items.push(previousPage + 1);
        if (previousPage && page - previousPage > 2) items.push("ellipsis");

        items.push(page);
    });

    return items;
};

function Pagination({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    disabled = false,
    ariaLabel = "Phân trang",
    className = "",
}) {
    const parsedTotal = Number(totalPages);
    const parsedCurrent = Number(currentPage);
    const safeTotal = Number.isFinite(parsedTotal)
        ? Math.max(0, Math.trunc(parsedTotal))
        : 0;
    const safeCurrent = Number.isFinite(parsedCurrent)
        ? Math.min(safeTotal, Math.max(1, Math.trunc(parsedCurrent)))
        : 1;
    const hasPageChangeHandler = typeof onPageChange === "function";

    if (safeTotal === 0) return null;

    const pageItems = buildPageItems(safeCurrent, safeTotal);

    const changePage = (page) => {
        if (
            !disabled &&
            hasPageChangeHandler &&
            page !== safeCurrent &&
            page >= 1 &&
            page <= safeTotal
        ) {
            onPageChange(page);
        }
    };

    return (
        <nav className={`customer-pagination ${className}`.trim()} aria-label={ariaLabel}>
            <button
                type="button"
                className="customer-pagination__control"
                disabled={disabled || !hasPageChangeHandler || safeCurrent === 1}
                onClick={() => changePage(safeCurrent - 1)}
                aria-label="Trang trước"
            >
                <span aria-hidden="true">←</span>
                <span>Trước</span>
            </button>

            <div className="customer-pagination__pages">
                {pageItems.map((item, index) =>
                    item === "ellipsis" ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="customer-pagination__ellipsis"
                            aria-hidden="true"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            type="button"
                            key={item}
                            className={`customer-pagination__page ${
                                item === safeCurrent ? "is-active" : ""
                            }`}
                            aria-label={`Trang ${item}`}
                            aria-current={item === safeCurrent ? "page" : undefined}
                            disabled={disabled || !hasPageChangeHandler}
                            onClick={() => changePage(item)}
                        >
                            {item}
                        </button>
                    ),
                )}
            </div>

            <button
                type="button"
                className="customer-pagination__control"
                disabled={disabled || !hasPageChangeHandler || safeCurrent === safeTotal}
                onClick={() => changePage(safeCurrent + 1)}
                aria-label="Trang sau"
            >
                <span>Sau</span>
                <span aria-hidden="true">→</span>
            </button>

            <span className="customer-pagination__summary" aria-live="polite">
                Trang {safeCurrent}/{safeTotal}
            </span>
        </nav>
    );
}

export default Pagination;
