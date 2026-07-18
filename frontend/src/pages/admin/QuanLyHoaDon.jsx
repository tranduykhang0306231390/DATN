// src/pages/admin/QuanLyHoaDon.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import hoaDonAdminApi from '../../api/hoaDonAdminApi';
import Modal from '../../components/admin/Modal';

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const fmtDateTime = (s) => {
    if (!s) return '—';
    const d = new Date(String(s).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString('vi-VN');
};

<<<<<<< HEAD
const trangThaiLabel = (status) => ({
    ChuaThanhToan: 'Chưa thanh toán',
    DaThanhToan: 'Đã thanh toán',
    DaHuy: 'Đã hủy',
}[status] || 'Không xác định');
=======
// Cấu hình 3 trạng thái hóa đơn. Màu để inline vì admin.css chỉ có
// admin-badge--on (xanh) và --off (xám), chưa có màu vàng cho "đang phục vụ".
const TRANG_THAI = {
    ChuaThanhToan: { label: 'Đang phục vụ',  bg: '#fef9c3', color: '#a16207' },
    DaThanhToan:   { label: 'Đã thanh toán', bg: '#dcfce7', color: '#15803d' },
    DaHuy:         { label: 'Đã hủy',        bg: '#f1f5f9', color: '#64748b' },
};
const ttInfo = (tt) => TRANG_THAI[tt] || { label: tt || '—', bg: '#f1f5f9', color: '#64748b' };
const trangThaiLabel = (tt) => ttInfo(tt).label;

// Badge trạng thái dùng lại ở cả bảng lẫn modal
const TrangThaiBadge = ({ tt }) => (
    <span
        className="admin-badge"
        style={{ background: ttInfo(tt).bg, color: ttInfo(tt).color }}
    >
        {trangThaiLabel(tt)}
    </span>
);
>>>>>>> origin/KhoiNguyen_QuanLyBanner

export default function QuanLyHoaDon() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [page, setPage] = useState(1);

    // Modal chi tiết
    const [detailOpen, setDetailOpen] = useState(false);
    const [detail, setDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        hoaDonAdminApi
            .getAll({ keyword: search, trang_thai: trangThai, page, per_page: 10 })
            .then((res) => {
                const body = res.data;
                // Hỗ trợ cả 2 dạng: { data, pagination } hoặc Laravel paginate mặc định
                const rows = body?.data?.data || body?.data || [];
                const pg = body?.pagination || {
                    current_page: body?.data?.current_page ?? 1,
                    last_page: body?.data?.last_page ?? 1,
                    total: body?.data?.total ?? rows.length,
                };
                setList(Array.isArray(rows) ? rows : []);
                setPagination(pg);
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, trangThai, page]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void loadList(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadList]);

    const openDetail = async (maHD) => {
        setDetailOpen(true);
        setLoadingDetail(true);
        setDetail(null);
        try {
            const res = await hoaDonAdminApi.getById(maHD);
            setDetail(res.data?.data || null);
        } catch {
            Swal.fire('Lỗi', 'Không tải được chi tiết hóa đơn', 'error');
            setDetailOpen(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Hủy bàn đang phục vụ — chỉ dùng cho hóa đơn ChuaThanhToan
    const handleHuyBan = async (maHD, soBan) => {
        const confirm = await Swal.fire({
            title: soBan ? `Hủy bàn ${soBan}?` : `Hủy hóa đơn ${maHD}?`,
            html: 'Hóa đơn sẽ chuyển sang trạng thái <b>Đã hủy</b> và bàn được giải phóng.<br>Khách không được tích điểm.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận hủy',
            cancelButtonText: 'Không',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;
        try {
            await hoaDonAdminApi.huyBan(maHD);
            Swal.fire({ icon: 'success', title: 'Đã hủy bàn', timer: 1500, showConfirmButton: false });
            setDetailOpen(false);
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không hủy được bàn', 'error');
        }
    };

    // Hủy hóa đơn ĐÃ THANH TOÁN — hoàn điểm đã tích + trả lại voucher đã dùng.
    // Nếu điểm hoàn lại làm khách không còn đủ điều kiện giữ hạng hiện tại,
    // hệ thống sẽ tự động hạ hạng lại (đảo ngược đúng những gì hóa đơn này
    // đã gây ra) — khác với việc tích điểm bình thường (chỉ tự động nâng).
    const handleHuyDaThanhToan = async (maHD) => {
        const confirm = await Swal.fire({
            title: `Hủy hóa đơn ${maHD} đã thanh toán?`,
            html: 'Hệ thống sẽ <b>hoàn lại điểm</b> đã tích và <b>trả lại voucher</b> đã dùng cho khách.<br>' +
                  'Nếu khách không còn đủ điểm giữ hạng hiện tại, hạng thành viên sẽ <b>tự động điều chỉnh lại</b>.<br>' +
                  'Thao tác này không thể hoàn tác.',
            icon: 'warning',
            input: 'text',
            inputLabel: 'Lý do hủy (bắt buộc)',
            inputPlaceholder: 'VD: khách gọi nhầm món, yêu cầu hoàn tiền...',
            inputValidator: (value) => (!value?.trim() ? 'Vui lòng nhập lý do hủy' : undefined),
            showCancelButton: true,
            confirmButtonText: 'Xác nhận hủy',
            cancelButtonText: 'Không',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;
        try {
            const res = await hoaDonAdminApi.huyDaThanhToan(maHD, confirm.value);
            const d = res.data?.data;
            const dong = [];
            if (d?.DiemDaHoan > 0) dong.push(`Đã hoàn ${d.DiemDaHoan} điểm`);
            if (d?.SoVoucherHoan > 0) dong.push(`trả lại ${d.SoVoucherHoan} voucher`);
            let html = dong.length ? dong.join(', ') + '.' : undefined;
            if (d?.DaHaHang && d?.TenHangMoi) {
                html = (html ? html + '<br>' : '') + `Khách đã được điều chỉnh hạng xuống <b>${d.TenHangMoi}</b>.`;
            }
            Swal.fire({
                icon: 'success',
                title: 'Đã hủy hóa đơn',
                html,
                timer: 2600,
                showConfirmButton: false,
            });
            setDetailOpen(false);
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không hủy được hóa đơn', 'error');
        }
    };

    const applyFilter = () => {
        if (page === 1) void loadList();
        else setPage(1);
    };

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Vận hành</span>
                    <h2 className="admin-hero-title">Quản lý hóa đơn</h2>
                </div>
            </header>

            {/* Thanh công cụ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo mã hóa đơn, khách hàng…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <select
                    className="admin-select"
                    value={trangThai}
                    onChange={(e) => setTrangThai(e.target.value)}
                >
                    <option value="">Mọi trạng thái</option>
                    <option value="ChuaThanhToan">Đang phục vụ</option>
                    <option value="DaThanhToan">Đã thanh toán</option>
                    <option value="DaHuy">Đã hủy</option>
                </select>
                <button type="button" className="admin-btn admin-btn--primary" onClick={applyFilter}>
                    Lọc
                </button>
            </div>

            {/* Bảng */}
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
                            <th>Điểm tích lũy</th>
                            <th>Trạng thái</th>
                            <th className="admin-th-action">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="admin-state">Chưa có hóa đơn nào.</td>
                            </tr>
                        ) : (
                            list.map((hd) => (
                                <tr key={hd.MaHoaDon}>
                                    <td className="admin-mono">{hd.MaHoaDon}</td>
                                    <td>{hd.SoBan ? `Bàn ${hd.SoBan}` : '—'}</td>
                                    <td className="admin-nowrap">{fmtDateTime(hd.NgayLap)}</td>
                                    <td>
                                        {hd.khach_hang?.HoTen || hd.khachHang?.HoTen || hd.MaKhachHang || 'Khách vãng lai'}
                                    </td>
                                    <td>
                                        {hd.nhan_vien?.HoTen || hd.nhanVien?.HoTen || hd.MaNhanVien || '—'}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{fmtMoney(hd.TongTien)}</td>
                                    <td>{hd.DiemTichLuy ?? 0}</td>
                                    <td><TrangThaiBadge tt={hd.TrangThai} /></td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                                onClick={() => openDetail(hd.MaHoaDon)}
                                            >
                                                Chi tiết
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            {pagination.last_page > 1 && (
                <div className="admin-pagination">
                    <button
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={pagination.current_page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        ← Trước
                    </button>
                    <span className="admin-page-info">
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} hóa đơn
                    </span>
                    <button
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={pagination.current_page >= pagination.last_page}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* Modal chi tiết */}
            <Modal
                open={detailOpen}
                title={`Chi tiết hóa đơn ${detail?.MaHoaDon || ''}`}
                onClose={() => setDetailOpen(false)}
                width={640}
                footer={
                    <>
                        <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => setDetailOpen(false)}
                        >
                            Đóng
                        </button>
                        {detail?.TrangThai === 'ChuaThanhToan' && (
                            <button
                                type="button"
                                className="admin-btn admin-btn--danger"
                                onClick={() => handleHuyBan(detail.MaHoaDon, detail.SoBan)}
                            >
                                🚫 Hủy bàn
                            </button>
                        )}
                        {detail?.TrangThai === 'DaThanhToan' && (
                            <button
                                type="button"
                                className="admin-btn admin-btn--danger"
                                onClick={() => handleHuyDaThanhToan(detail.MaHoaDon)}
                            >
                                🚫 Hủy &amp; hoàn điểm
                            </button>
                        )}
                    </>
                }
            >
                {loadingDetail ? (
                    <div className="admin-state">Đang tải…</div>
                ) : !detail ? (
                    <div className="admin-state">Không có dữ liệu.</div>
                ) : (
                    <>
                        {/* Thông tin chung */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 12,
                                background: '#f5f6fb',
                                borderRadius: 12,
                                padding: '14px 16px',
                                marginBottom: 16,
                                fontSize: 13,
                            }}
                        >
                            <div>
                                <div style={{ color: '#64748b' }}>Ngày lập</div>
                                <div style={{ fontWeight: 600 }}>{fmtDateTime(detail.NgayLap)}</div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b' }}>Trạng thái</div>
                                <div><TrangThaiBadge tt={detail.TrangThai} /></div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b' }}>Số bàn</div>
                                <div style={{ fontWeight: 600 }}>
                                    {detail.SoBan ? `Bàn ${detail.SoBan}` : '—'}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b' }}>Khách hàng</div>
                                <div style={{ fontWeight: 600 }}>
                                    {detail.khach_hang?.HoTen || detail.khachHang?.HoTen || 'Khách vãng lai'}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b' }}>Nhân viên lập</div>
                                <div style={{ fontWeight: 600 }}>
                                    {detail.nhan_vien?.HoTen || detail.nhanVien?.HoTen || detail.MaNhanVien}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b' }}>Điểm tích lũy</div>
                                <div style={{ fontWeight: 600 }}>{detail.DiemTichLuy ?? 0}</div>
                            </div>
                        </div>

                        {/* Chi tiết vé */}
                        <table className="admin-table" style={{ minWidth: 0 }}>
                            <thead>
                                <tr>
                                    <th>Loại vé</th>
                                    <th>SL</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(detail.chi_tiet_hoa_don || detail.chiTietHoaDon || []).map((ct) => (
                                    <tr key={ct.MaChiTietHD}>
                                        <td>{ct.loai_ve?.TenLoaiVe || ct.loaiVe?.TenLoaiVe || ct.MaLoaiVe}</td>
                                        <td>{ct.SoLuong}</td>
                                        <td>{fmtMoney(ct.DonGia)}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {fmtMoney(ct.SoLuong * ct.DonGia)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 16,
                                paddingTop: 14,
                                borderTop: '2px solid #e6e9f2',
                                fontSize: 16,
                                fontWeight: 700,
                            }}
                        >
                            <span>
                                {detail.TrangThai === 'ChuaThanhToan' ? 'Tạm tính' : 'Tổng thanh toán'}
                            </span>
                            <span style={{ color: '#4f46e5' }}>{fmtMoney(detail.TongTien)}</span>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
