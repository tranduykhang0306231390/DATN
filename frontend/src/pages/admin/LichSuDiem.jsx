// src/pages/admin/LichSuDiem.jsx
import { useEffect, useState, useCallback } from 'react';
import '../../assets/css/admin.css';
import lichSuDiemApi from '../../api/lichSuDiemApi';

const LOAI_OPTIONS = [
    { value: 'CongDiemHoaDon', label: 'Cộng điểm hóa đơn' },
    { value: 'DoiVoucher', label: 'Đổi voucher' },
];

const loaiLabel = (l) => LOAI_OPTIONS.find((o) => o.value === l)?.label || l;

export default function LichSuDiem() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [loai, setLoai] = useState('');
    const [page, setPage] = useState(1);

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        lichSuDiemApi
            .getAll({ ma_khach_hang: search, loai_giao_dich: loai, page, per_page: 10 })
            .then((res) => {
                if (res.data?.success) {
                    setList(res.data.data);
                    setPagination(res.data.pagination);
                }
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, loai, page]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void loadList(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadList]);

    const applyFilter = () => {
        if (page === 1) void loadList();
        else setPage(1);
    };

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Ưu đãi &amp; tích điểm</span>
                    <h2 className="admin-hero-title">Lịch sử giao dịch điểm</h2>
                </div>
            </header>

            {/* Thanh công cụ */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo mã khách hàng (VD: KH001)…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <select className="admin-select" value={loai} onChange={(e) => setLoai(e.target.value)}>
                    <option value="">Tất cả loại</option>
                    {LOAI_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
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
                            <th>Mã GD</th>
                            <th>Loại giao dịch</th>
                            <th>Khách hàng</th>
                            <th>Điểm</th>
                            <th>Trước → Sau</th>
                            <th>Tham chiếu</th>
                            <th>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="admin-state">Chưa có giao dịch điểm nào.</td>
                            </tr>
                        ) : (
                            list.map((ls) => {
                                const tang = Number(ls.SoDiemSau) >= Number(ls.SoDiemTruoc);
                                return (
                                    <tr key={ls.MaGiaoDichDiem}>
                                        <td className="admin-mono">{ls.MaGiaoDichDiem}</td>
                                        <td>{loaiLabel(ls.LoaiGiaoDich)}</td>
                                        <td>
                                            <div>{ls.TenKhachHang || ls.MaKhachHang}</div>
                                            <div className="admin-mono" style={{ fontSize: 12 }}>{ls.MaKhachHang}</div>
                                        </td>
                                        <td style={{ color: tang ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                            {tang ? '+' : '−'}{ls.SoDiem}
                                        </td>
                                        <td className="admin-nowrap">
                                            {ls.SoDiemTruoc} → {ls.SoDiemSau}
                                        </td>
                                        <td className="admin-mono">{ls.MaThamChieu || '—'}</td>
                                        <td className="admin-nowrap">{(ls.ThoiGianGiaoDich || '').slice(0, 10)}</td>
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
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={pagination.current_page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        ← Trước
                    </button>
                    <span className="admin-page-info">
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} giao dịch
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
        </div>
    );
}
