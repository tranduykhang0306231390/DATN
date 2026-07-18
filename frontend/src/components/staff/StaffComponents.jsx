// src/components/staff/StaffComponents.jsx
// Các component và helper dùng chung cho khu vực Staff.

import { TRANG_THAI_CONFIG } from './staffUtils';

/*
|--------------------------------------------------------------------------
| Re-export để tương thích với code cũ
|--------------------------------------------------------------------------
|
| TRANG_THAI_CONFIG vẫn được quản lý tập trung trong staffUtils.js.
| Những file đang import từ StaffComponents.jsx sẽ không bị lỗi.
|
*/

export { TRANG_THAI_CONFIG };

/*
|--------------------------------------------------------------------------
| Format helpers
|--------------------------------------------------------------------------
*/

export const fmt = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return '0 ₫';
    }

    return number.toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
    });
};

export const fmtDate = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString('vi-VN');
};

/*
|--------------------------------------------------------------------------
| Nhãn dùng chung
|--------------------------------------------------------------------------
*/

export const BUOI_LABEL = {
    Trua: '🌤 Trưa',
    Toi: '🌙 Tối',
};

export const NGAY_LABEL = {
    NgayThuong: 'Ngày thường',
    CuoiTuan: 'Cuối tuần',
};

export const NHOM_LABEL = {
    GiamTien: 'Giảm tiền',
    PhanTram: 'Giảm %',
    TangMon: 'Tặng món',
};

/*
|--------------------------------------------------------------------------
| PageTitle
|--------------------------------------------------------------------------
*/

export function PageTitle({ children }) {
    return (
        <h2 className="staff-page-title">
            {children}
        </h2>
    );
}

/*
|--------------------------------------------------------------------------
| StatCard
|--------------------------------------------------------------------------
*/

export function StatCard({
    label,
    value,
    color,
    icon,
}) {
    return (
        <div className="stat-card">
            <div
                className="stat-icon"
                style={{ background: color }}
                aria-hidden="true"
            >
                {icon}
            </div>

            <div>
                <div className="stat-value">
                    {value}
                </div>

                <div className="stat-label">
                    {label}
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Table helpers
|--------------------------------------------------------------------------
*/

export function Th({
    children,
    align = 'left',
}) {
    return (
        <th style={{ textAlign: align }}>
            {children}
        </th>
    );
}

export function Td({
    children,
    align = 'left',
    bold = false,
}) {
    return (
        <td
            style={{
                textAlign: align,
                fontWeight: bold ? 600 : 400,
            }}
        >
            {children}
        </td>
    );
}

/*
|--------------------------------------------------------------------------
| Trạng thái
|--------------------------------------------------------------------------
*/

export function TrangThaiBadge({ trangThai }) {
    const config = TRANG_THAI_CONFIG[trangThai] ?? {
        badgeClass: 'badge',
        label: trangThai || 'Không xác định',
    };

    return (
        <span className={config.badgeClass}>
            {config.label}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
|
| itemLabel được thêm để component có thể dùng cho hóa đơn, nhân viên,
| khách hàng, banner hoặc dữ liệu khác.
|
| Không truyền itemLabel thì vẫn giữ chữ "hóa đơn" để tương thích giao diện cũ.
|
*/

export function Pagination({
    pagination,
    page,
    onPageChange,
    itemLabel = 'hóa đơn',
}) {
    if (
        !pagination
        || Number(pagination.last_page) <= 1
    ) {
        return null;
    }

    const currentPage = Number(
        page || pagination.current_page || 1
    );

    const lastPage = Number(
        pagination.last_page || 1
    );

    const total = Number(
        pagination.total || 0
    );

    const handlePageChange = (targetPage) => {
        const normalizedPage = Math.max(
            1,
            Math.min(lastPage, targetPage)
        );

        if (
            normalizedPage === currentPage
            || typeof onPageChange !== 'function'
        ) {
            return;
        }

        onPageChange(normalizedPage);
    };

    return (
        <div
            className="pagination-row"
            aria-label="Phân trang"
        >
            <button
                type="button"
                className="page-btn"
                disabled={currentPage <= 1}
                onClick={() =>
                    handlePageChange(currentPage - 1)
                }
            >
                ‹ Trước
            </button>

            {Array.from(
                { length: lastPage },
                (_, index) => index + 1
            ).map((pageNumber) => (
                <button
                    type="button"
                    key={pageNumber}
                    className={
                        `page-btn${
                            pageNumber === currentPage
                                ? ' active'
                                : ''
                        }`
                    }
                    aria-current={
                        pageNumber === currentPage
                            ? 'page'
                            : undefined
                    }
                    onClick={() =>
                        handlePageChange(pageNumber)
                    }
                >
                    {pageNumber}
                </button>
            ))}

            <button
                type="button"
                className="page-btn"
                disabled={currentPage >= lastPage}
                onClick={() =>
                    handlePageChange(currentPage + 1)
                }
            >
                Sau ›
            </button>

            <span className="page-info">
                Trang {currentPage}/{lastPage}
                {' · '}
                {total} {itemLabel}
            </span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

export function Modal({
    open,
    onClose,
    children,
    ariaLabel = 'Hộp thoại',
}) {
    if (!open) {
        return null;
    }

    const handleOverlayClick = () => {
        if (typeof onClose === 'function') {
            onClose();
        }
    };

    return (
        <div
            className="modal-overlay"
            role="presentation"
            onClick={handleOverlayClick}
        >
            <div
                className="modal-box"
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                {children}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| InfoBlock
|--------------------------------------------------------------------------
*/

export function InfoBlock({
    title,
    children,
}) {
    return (
        <div className="info-block">
            <div className="info-block-title">
                {title}
            </div>

            <div className="info-block-val">
                {children}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| SumRow
|--------------------------------------------------------------------------
*/

export function SumRow({
    label,
    value,
    color,
    bold = false,
    accent = false,
}) {
    return (
        <div className="sum-row">
            <span
                style={{
                    color: '#6b7280',
                }}
            >
                {label}
            </span>

            <span
                style={{
                    color: accent
                        ? '#b45309'
                        : (color || '#111827'),

                    fontWeight:
                        bold || accent
                            ? 700
                            : 400,

                    fontSize:
                        accent
                            ? 17
                            : 14,
                }}
            >
                {value}
            </span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| LoadingBox
|--------------------------------------------------------------------------
*/

export function LoadingBox({
    text = 'Đang tải...',
}) {
    return (
        <div
            className="loading-box"
            role="status"
            aria-live="polite"
        >
            {text}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| EmptyBox
|--------------------------------------------------------------------------
*/

export function EmptyBox({
    text = 'Không có dữ liệu',
}) {
    return (
        <div className="empty-box">
            {text}
        </div>
    );
}