// src/pages/admin/QuanLyHoaDon.jsx

import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import Swal from 'sweetalert2';

import hoaDonAdminApi from '../../api/hoaDonAdminApi';
import Modal from '../../components/admin/Modal';

import '../../assets/css/admin.css';

/*
|--------------------------------------------------------------------------
| Format helpers
|--------------------------------------------------------------------------
*/

const fmtMoney = (value) => {
    const number = Number(value);

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number.isFinite(number) ? number : 0);
};

const fmtDateTime = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(
        String(value).replace(' ', 'T')
    );

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString('vi-VN');
};

/*
|--------------------------------------------------------------------------
| Trạng thái hóa đơn
|--------------------------------------------------------------------------
*/

const TRANG_THAI_CONFIG = {
    ChuaThanhToan: {
        label: 'Đang phục vụ',
        background: '#fef3c7',
        color: '#b45309',
    },

    DaThanhToan: {
        label: 'Đã thanh toán',
        background: '#dcfce7',
        color: '#15803d',
    },

    DaHuy: {
        label: 'Đã hủy',
        background: '#fee2e2',
        color: '#b91c1c',
    },
};

const getTrangThaiConfig = (trangThai) => (
    TRANG_THAI_CONFIG[trangThai] ?? {
        label: trangThai || 'Không xác định',
        background: '#f1f5f9',
        color: '#64748b',
    }
);

function TrangThaiBadge({ trangThai }) {
    const config = getTrangThaiConfig(trangThai);

    return (
        <span
            className="admin-badge"
            style={{
                background: config.background,
                color: config.color,
            }}
        >
            {config.label}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Response helpers
|--------------------------------------------------------------------------
*/

const getCustomer = (hoaDon) => (
    hoaDon?.khach_hang
    ?? hoaDon?.khachHang
    ?? null
);

const getStaff = (hoaDon) => (
    hoaDon?.nhan_vien
    ?? hoaDon?.nhanVien
    ?? null
);

const getInvoiceDetails = (hoaDon) => {
    const details = (
        hoaDon?.chi_tiet_hoa_don
        ?? hoaDon?.chiTietHoaDon
        ?? []
    );

    return Array.isArray(details)
        ? details
        : [];
};

export default function QuanLyHoaDon() {
    const [list, setList] = useState([]);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    const [loading, setLoading] = useState(true);

    /*
    |--------------------------------------------------------------------------
    | Bộ lọc
    |--------------------------------------------------------------------------
    */

    const [search, setSearch] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [page, setPage] = useState(1);

    /*
    |--------------------------------------------------------------------------
    | Modal chi tiết
    |--------------------------------------------------------------------------
    */

    const [detailOpen, setDetailOpen] =
        useState(false);

    const [detail, setDetail] =
        useState(null);

    const [loadingDetail, setLoadingDetail] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Lấy danh sách
    |--------------------------------------------------------------------------
    */

    const loadList = useCallback(async () => {
        setLoading(true);

        try {
            const response = await hoaDonAdminApi.getAll({
                keyword: search.trim(),
                trang_thai: trangThai,
                page,
                per_page: 10,
            });

            const body = response.data;

            /*
             * Hỗ trợ cả:
             * { data: [...], pagination: {...} }
             *
             * và Laravel paginator:
             * { data: { data: [...], current_page, ... } }
             */
            const rows =
                body?.data?.data
                ?? body?.data
                ?? [];

            const nextPagination =
                body?.pagination
                ?? {
                    current_page:
                        body?.data?.current_page
                        ?? 1,

                    last_page:
                        body?.data?.last_page
                        ?? 1,

                    per_page:
                        body?.data?.per_page
                        ?? 10,

                    total:
                        body?.data?.total
                        ?? (
                            Array.isArray(rows)
                                ? rows.length
                                : 0
                        ),
                };

            setList(
                Array.isArray(rows)
                    ? rows
                    : []
            );

            setPagination({
                current_page:
                    Number(
                        nextPagination.current_page
                        ?? page
                    ),

                last_page:
                    Number(
                        nextPagination.last_page
                        ?? 1
                    ),

                per_page:
                    Number(
                        nextPagination.per_page
                        ?? 10
                    ),

                total:
                    Number(
                        nextPagination.total
                        ?? 0
                    ),
            });
        } catch (error) {
            setList([]);

            setPagination({
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: 0,
            });

            const message =
                error.response?.data?.message
                ?? 'Không tải được danh sách hóa đơn.';

            Swal.fire({
                icon: 'error',
                title: 'Không thể tải dữ liệu',
                text: message,
            });
        } finally {
            setLoading(false);
        }
    }, [
        page,
        search,
        trangThai,
    ]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    /*
    |--------------------------------------------------------------------------
    | Xem chi tiết
    |--------------------------------------------------------------------------
    */

    const openDetail = async (maHoaDon) => {
        setDetailOpen(true);
        setLoadingDetail(true);
        setDetail(null);

        try {
            const response =
                await hoaDonAdminApi.getById(
                    maHoaDon
                );

            setDetail(
                response.data?.data
                ?? null
            );
        } catch (error) {
            const message =
                error.response?.data?.message
                ?? 'Không tải được chi tiết hóa đơn.';

            await Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: message,
            });

            setDetailOpen(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeDetail = () => {
        if (loadingDetail) {
            return;
        }

        setDetailOpen(false);
        setDetail(null);
    };

    /*
    |--------------------------------------------------------------------------
    | Áp dụng bộ lọc
    |--------------------------------------------------------------------------
    */

    const applyFilter = () => {
        if (page !== 1) {
            setPage(1);
            return;
        }

        void loadList();
    };

    const handleStatusChange = (event) => {
        setTrangThai(event.target.value);
        setPage(1);
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    const detailCustomer =
        getCustomer(detail);

    const detailStaff =
        getStaff(detail);

    const detailRows =
        getInvoiceDetails(detail);

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">
                        Vận hành
                    </span>

                    <h2 className="admin-hero-title">
                        Quản lý hóa đơn
                    </h2>
                </div>
            </header>

            {/* Bộ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo mã hóa đơn, bàn, tên hoặc số điện thoại..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            applyFilter();
                        }
                    }}
                />

                <select
                    className="admin-select"
                    value={trangThai}
                    onChange={handleStatusChange}
                >
                    <option value="">
                        Mọi trạng thái
                    </option>

                    <option value="ChuaThanhToan">
                        Đang phục vụ
                    </option>

                    <option value="DaThanhToan">
                        Đã thanh toán
                    </option>

                    <option value="DaHuy">
                        Đã hủy
                    </option>
                </select>

                <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={applyFilter}
                    disabled={loading}
                >
                    {loading
                        ? 'Đang tải...'
                        : 'Lọc'}
                </button>
            </div>

            {/* Bảng hóa đơn */}
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã HĐ</th>
                            <th>Bàn</th>
                            <th>Ngày lập</th>
                            <th>Khách hàng</th>
                            <th>Nhân viên</th>
                            <th>Tổng tiền</th>
                            <th>Điểm</th>
                            <th>Trạng thái</th>
                            <th className="admin-th-action">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="admin-state"
                                >
                                    Đang tải…
                                </td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="admin-state"
                                >
                                    Chưa có hóa đơn nào.
                                </td>
                            </tr>
                        ) : (
                            list.map((hoaDon) => {
                                const customer =
                                    getCustomer(hoaDon);

                                const staff =
                                    getStaff(hoaDon);

                                return (
                                    <tr key={hoaDon.MaHoaDon}>
                                        <td className="admin-mono">
                                            {hoaDon.MaHoaDon}
                                        </td>

                                        <td>
                                            {hoaDon.SoBan
                                                ? `Bàn ${hoaDon.SoBan}`
                                                : '—'}
                                        </td>

                                        <td className="admin-nowrap">
                                            {fmtDateTime(
                                                hoaDon.NgayLap
                                            )}
                                        </td>

                                        <td>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {customer?.HoTen
                                                    ?? hoaDon.MaKhachHang
                                                    ?? 'Khách vãng lai'}
                                            </div>

                                            {customer?.SoDienThoai && (
                                                <div
                                                    style={{
                                                        marginTop: 2,
                                                        color: '#64748b',
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {
                                                        customer.SoDienThoai
                                                    }
                                                </div>
                                            )}
                                        </td>

                                        <td>
                                            {staff?.HoTen
                                                ?? hoaDon.MaNhanVien
                                                ?? '—'}
                                        </td>

                                        <td
                                            style={{
                                                fontWeight: 600,
                                            }}
                                        >
                                            {fmtMoney(
                                                hoaDon.TongTien
                                            )}
                                        </td>

                                        <td>
                                            {hoaDon.DiemTichLuy
                                                ?? 0}
                                        </td>

                                        <td>
                                            <TrangThaiBadge
                                                trangThai={
                                                    hoaDon.TrangThai
                                                }
                                            />
                                        </td>

                                        <td className="admin-th-action">
                                            <div className="admin-row-actions">
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn--ghost admin-btn--sm"
                                                    onClick={() =>
                                                        openDetail(
                                                            hoaDon.MaHoaDon
                                                        )
                                                    }
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            {pagination.last_page > 1 && (
                <div className="admin-pagination">
                    <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={
                            loading
                            || pagination.current_page <= 1
                        }
                        onClick={() =>
                            setPage((current) =>
                                Math.max(
                                    1,
                                    current - 1
                                )
                            )
                        }
                    >
                        ← Trước
                    </button>

                    <span className="admin-page-info">
                        Trang {pagination.current_page}
                        {' / '}
                        {pagination.last_page}
                        {' · '}
                        {pagination.total} hóa đơn
                    </span>

                    <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={
                            loading
                            || pagination.current_page
                                >= pagination.last_page
                        }
                        onClick={() =>
                            setPage((current) =>
                                Math.min(
                                    pagination.last_page,
                                    current + 1
                                )
                            )
                        }
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* Modal chi tiết */}
            <Modal
                open={detailOpen}
                title={
                    `Chi tiết hóa đơn ${
                        detail?.MaHoaDon ?? ''
                    }`
                }
                onClose={closeDetail}
                width={680}
                footer={
                    <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={closeDetail}
                        disabled={loadingDetail}
                    >
                        Đóng
                    </button>
                }
            >
                {loadingDetail ? (
                    <div className="admin-state">
                        Đang tải…
                    </div>
                ) : !detail ? (
                    <div className="admin-state">
                        Không có dữ liệu.
                    </div>
                ) : (
                    <>
                        {/* Thông tin chung */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(2, minmax(0, 1fr))',
                                gap: 12,
                                marginBottom: 16,
                                padding: '14px 16px',
                                borderRadius: 12,
                                background: '#f5f6fb',
                                fontSize: 13,
                            }}
                        >
                            <div>
                                <div style={styles.infoLabel}>
                                    Ngày lập
                                </div>

                                <div style={styles.infoValue}>
                                    {fmtDateTime(
                                        detail.NgayLap
                                    )}
                                </div>
                            </div>

                            <div>
                                <div style={styles.infoLabel}>
                                    Trạng thái
                                </div>

                                <div>
                                    <TrangThaiBadge
                                        trangThai={
                                            detail.TrangThai
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <div style={styles.infoLabel}>
                                    Số bàn
                                </div>

                                <div style={styles.infoValue}>
                                    {detail.SoBan
                                        ? `Bàn ${detail.SoBan}`
                                        : '—'}
                                </div>
                            </div>

                            <div>
                                <div style={styles.infoLabel}>
                                    Khách hàng
                                </div>

                                <div style={styles.infoValue}>
                                    {detailCustomer?.HoTen
                                        ?? detail.MaKhachHang
                                        ?? 'Khách vãng lai'}
                                </div>

                                {detailCustomer?.SoDienThoai && (
                                    <div style={styles.infoSecondary}>
                                        {
                                            detailCustomer.SoDienThoai
                                        }
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={styles.infoLabel}>
                                    Nhân viên lập
                                </div>

                                <div style={styles.infoValue}>
                                    {detailStaff?.HoTen
                                        ?? detail.MaNhanVien
                                        ?? '—'}
                                </div>
                            </div>

                            <div>
                                <div style={styles.infoLabel}>
                                    Điểm tích lũy
                                </div>

                                <div style={styles.infoValue}>
                                    {detail.DiemTichLuy
                                        ?? 0}
                                </div>
                            </div>

                            {detail.MaVoucher && (
                                <div
                                    style={{
                                        gridColumn:
                                            '1 / -1',
                                    }}
                                >
                                    <div style={styles.infoLabel}>
                                        Voucher áp dụng
                                    </div>

                                    <div
                                        className="admin-mono"
                                        style={styles.infoValue}
                                    >
                                        {detail.MaVoucher}
                                    </div>
                                </div>
                            )}

                            {detail.TrangThai === 'DaHuy'
                                && detail.LyDoHuy && (
                                    <div
                                        style={{
                                            gridColumn:
                                                '1 / -1',
                                            paddingTop: 10,
                                            borderTop:
                                                '1px solid #e2e8f0',
                                        }}
                                    >
                                        <div style={styles.infoLabel}>
                                            Lý do hủy
                                        </div>

                                        <div style={styles.cancelReason}>
                                            {detail.LyDoHuy}
                                        </div>

                                        {detail.ThoiGianHuy && (
                                            <div style={styles.infoSecondary}>
                                                Thời gian hủy:{' '}
                                                {fmtDateTime(
                                                    detail.ThoiGianHuy
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>

                        {/* Chi tiết vé */}
                        <div className="admin-table-wrap">
                            <table
                                className="admin-table"
                                style={{
                                    minWidth: 0,
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th>Loại vé</th>
                                        <th>SL</th>
                                        <th>Đơn giá</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {detailRows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="admin-state"
                                            >
                                                Hóa đơn chưa có chi tiết.
                                            </td>
                                        </tr>
                                    ) : (
                                        detailRows.map(
                                            (chiTiet) => {
                                                const loaiVe =
                                                    chiTiet.loai_ve
                                                    ?? chiTiet.loaiVe;

                                                const thanhTien =
                                                    Number(
                                                        chiTiet.SoLuong
                                                        ?? 0
                                                    )
                                                    * Number(
                                                        chiTiet.DonGia
                                                        ?? 0
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            chiTiet.MaChiTietHD
                                                            ?? `${chiTiet.MaLoaiVe}-${chiTiet.SoLuong}`
                                                        }
                                                    >
                                                        <td>
                                                            {loaiVe?.TenLoaiVe
                                                                ?? chiTiet.MaLoaiVe
                                                                ?? '—'}
                                                        </td>

                                                        <td>
                                                            {chiTiet.SoLuong
                                                                ?? 0}
                                                        </td>

                                                        <td>
                                                            {fmtMoney(
                                                                chiTiet.DonGia
                                                            )}
                                                        </td>

                                                        <td
                                                            style={{
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {fmtMoney(
                                                                thanhTien
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Tổng tiền */}
                        <div style={styles.totalRow}>
                            <span>
                                {detail.TrangThai
                                    === 'ChuaThanhToan'
                                    ? 'Tạm tính'
                                    : 'Tổng thanh toán'}
                            </span>

                            <span style={styles.totalValue}>
                                {fmtMoney(
                                    detail.TongTien
                                )}
                            </span>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}

const styles = {
    infoLabel: {
        color: '#64748b',
    },

    infoValue: {
        marginTop: 2,
        fontWeight: 600,
    },

    infoSecondary: {
        marginTop: 3,
        color: '#64748b',
        fontSize: 12,
    },

    cancelReason: {
        marginTop: 4,
        color: '#b91c1c',
        fontWeight: 600,
        whiteSpace: 'pre-wrap',
    },

    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 14,
        borderTop: '2px solid #e6e9f2',
        fontSize: 16,
        fontWeight: 700,
    },

    totalValue: {
        color: '#4f46e5',
    },
};