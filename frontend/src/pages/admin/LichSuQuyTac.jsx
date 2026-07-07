// src/pages/admin/LichSuQuyTac.jsx
import { useEffect, useState, useCallback } from 'react';
import '../../assets/css/admin.css';
import lichSuQuyTacApi from '../../api/lichSuQuyTacApi';

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function LichSuQuyTac() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const loadList = useCallback(() => {
        setLoading(true);
        lichSuQuyTacApi
            .getAll({ ma_quy_tac: search, page, per_page: 10 })
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
        loadList();
    }, [loadList]);

    const applyFilter = () => {
        setPage(1);
        loadList();
    };

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Ưu đãi &amp; tích điểm</span>
                    <h2 className="admin-hero-title">Lịch sử thay đổi quy tắc</h2>
                </div>
            </header>

            {/* Thanh công cụ */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo mã quy tắc (VD: QT001)…"
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
                            <th>Quy tắc</th>
                            <th>Trước</th>
                            <th>Sau</th>
                            <th>Người thay đổi</th>
                            <th>Ghi chú</th>
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
                                <td colSpan={7} className="admin-state">Chưa có lịch sử thay đổi.</td>
                            </tr>
                        ) : (
                            list.map((ls) => (
                                <tr key={ls.MaLichSuQuyTac}>
                                    <td className="admin-mono">{ls.MaLichSuQuyTac}</td>
                                    <td className="admin-mono">{ls.MaQuyTac}</td>
                                    <td className="admin-nowrap">
                                        {fmtMoney(ls.SoTienQuyDoiCu)} = {ls.SoDiemNhanCu}đ
                                    </td>
                                    <td className="admin-nowrap">
                                        {fmtMoney(ls.SoTienQuyDoiMoi)} = {ls.SoDiemNhanMoi}đ
                                    </td>
                                    <td>{ls.TenNhanVien || ls.MaNhanVien}</td>
                                    <td>{ls.GhiChu || '—'}</td>
                                    <td className="admin-nowrap">{(ls.ThoiGian || '').slice(0, 10)}</td>
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