// src/pages/admin/LichSuHang.jsx
import { useEffect, useState, useCallback } from 'react';
import '../../assets/css/admin.css';
import lichSuHangApi from '../../api/lichSuHangApi';

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const fmtDateTime = (s) => {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString('vi-VN');
};

export default function LichSuHang() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        lichSuHangApi
            .getAll({ keyword: search, page, per_page: 10 })
            .then((res) => {
                if (res.data?.success) {
                    setList(res.data.data);
                    setPagination(res.data.pagination);
                }
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, page]);

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
                    <span className="admin-hero-eyebrow">Khách hàng &amp; thành viên</span>
                    <h2 className="admin-hero-title">Lịch sử hạng thành viên</h2>
                </div>
            </header>

            {/* Thanh công cụ */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo tên, SĐT hoặc mã khách hàng…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <button type="button" className="admin-btn admin-btn--primary" onClick={applyFilter}>
                    Lọc
                </button>
            </div>

            {/* Bảng */}
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã LS</th>
                            <th>Khách hàng</th>
                            <th>Thay đổi hạng</th>
                            <th>Điểm</th>
                            <th>Chi tiêu</th>
                            <th>Lý do</th>
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
                                <td colSpan={7} className="admin-state">Chưa có lịch sử thay đổi hạng.</td>
                            </tr>
                        ) : (
                            list.map((ls) => (
                                <tr key={ls.MaLichSuHang}>
                                    <td className="admin-mono">{ls.MaLichSuHang}</td>
                                    <td>
                                        <div>{ls.TenKhachHang || ls.MaKhachHang}</div>
                                        <div className="admin-mono" style={{ fontSize: 12 }}>{ls.MaKhachHang}</div>
                                    </td>
                                    <td className="admin-nowrap">
                                        {ls.TenHangCu || ls.MaHangThanhVienCu || 'Mới'}
                                        {' → '}
                                        <b>{ls.TenHangMoi || ls.MaHangThanhVienMoi}</b>
                                    </td>
                                    <td>{ls.DiemTaiThoiDiemTH ?? '—'}</td>
                                    <td>{fmtMoney(ls.TongChiTieuTaiThoiDiem)}</td>
                                    <td>{ls.LyDoThayDoi || '—'}</td>
                                    <td className="admin-nowrap">{fmtDateTime(ls.ThoiGianThayDoi)}</td>
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} bản ghi
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
