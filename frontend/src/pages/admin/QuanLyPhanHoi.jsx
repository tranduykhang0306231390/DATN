// src/pages/admin/QuanLyPhanHoi.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import phanHoiApi from '../../api/phanHoiApi';
import Modal from '../../components/admin/Modal';

const fmtDateTime = (s) => {
    if (!s) return '—';
    const d = new Date(String(s).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString('vi-VN');
};

const Sao = ({ diem }) => (
    <span style={{ color: '#f59e0b', letterSpacing: 1 }} title={`${diem}/5`}>
        {'★'.repeat(diem)}
        <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - diem)}</span>
    </span>
);

export default function QuanLyPhanHoi() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [thongKe, setThongKe] = useState(null);
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [diem, setDiem] = useState('');
    const [page, setPage] = useState(1);

    // Modal trả lời
    const [modalOpen, setModalOpen] = useState(false);
    const [current, setCurrent] = useState(null);
    const [traLoi, setTraLoi] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(() => {
        setLoading(true);
        phanHoiApi
            .getAll({ search, trang_thai: trangThai, diem, page, per_page: 10 })
            .then((res) => {
                if (res.data?.success) {
                    setList(res.data.data);
                    setPagination(res.data.pagination);
                    setThongKe(res.data.thong_ke);
                }
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, trangThai, diem, page]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const openTraLoi = (ph) => {
        setCurrent(ph);
        setTraLoi(ph.NoiDungPhanHoiCuaHang || '');
        setFormError('');
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!traLoi.trim()) {
            setFormError('Vui lòng nhập nội dung phản hồi.');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            await phanHoiApi.traLoi(current.MaPhanHoi, { NoiDungPhanHoiCuaHang: traLoi });
            setModalOpen(false);
            loadList();
            Swal.fire({
                icon: 'success',
                title: 'Đã gửi phản hồi',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            const res = err.response?.data;
            const firstErr = res?.errors ? Object.values(res.errors)[0]?.[0] : null;
            setFormError(firstErr || res?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    const applyFilter = () => {
        setPage(1);
        loadList();
    };

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Khách hàng &amp; thành viên</span>
                    <h2 className="admin-hero-title">Phản hồi khách hàng</h2>
                </div>
                
            </header>

            {/* Thanh công cụ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo nội dung, khách hàng, mã HĐ…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <select className="admin-select" value={diem} onChange={(e) => setDiem(e.target.value)}>
                    <option value="">Mọi mức đánh giá</option>
                    {[5, 4, 3, 2, 1].map((d) => (
                        <option key={d} value={d}>{d} sao</option>
                    ))}
                </select>
                <select
                    className="admin-select"
                    value={trangThai}
                    onChange={(e) => setTrangThai(e.target.value)}
                >
                    <option value="">Mọi trạng thái</option>
                    <option value="ChuaXuLy">Chưa xử lý</option>
                    <option value="DaXuLy">Đã xử lý</option>
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
                            <th>Mã</th>
                            <th>Khách hàng</th>
                            <th>Đánh giá</th>
                            <th>Nội dung</th>
                            <th>Hóa đơn</th>
                            <th>Trạng thái</th>
                            <th>Thời gian</th>
                            <th className="admin-th-action">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="admin-state">Chưa có phản hồi nào.</td>
                            </tr>
                        ) : (
                            list.map((ph) => (
                                <tr key={ph.MaPhanHoi}>
                                    <td className="admin-mono">{ph.MaPhanHoi}</td>
                                    <td>{ph.TenKhachHang || ph.MaKhachHang}</td>
                                    <td className="admin-nowrap"><Sao diem={ph.DiemDanhGia} /></td>
                                    <td style={{ maxWidth: 300, color: '#475569' }}>
                                        {ph.NoiDungCuaKhachHang}
                                    </td>
                                    <td className="admin-mono">{ph.MaHoaDon || '—'}</td>
                                    <td>
                                        <span
                                            className={`admin-badge ${ph.TrangThaiXuLy === 'DaXuLy' ? 'admin-badge--on' : 'admin-badge--off'}`}
                                        >
                                            {ph.TrangThaiXuLy === 'DaXuLy' ? 'Đã xử lý' : 'Chưa xử lý'}
                                        </span>
                                    </td>
                                    <td className="admin-nowrap">{fmtDateTime(ph.ThoiGian)}</td>
                                    <td className="admin-th-action">
                                        <button
                                            type="button"
                                            className={`admin-btn admin-btn--sm ${ph.TrangThaiXuLy === 'DaXuLy' ? 'admin-btn--ghost' : 'admin-btn--primary'}`}
                                            onClick={() => openTraLoi(ph)}
                                        >
                                            {ph.TrangThaiXuLy === 'DaXuLy' ? 'Xem' : 'Trả lời'}
                                        </button>
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} phản hồi
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

            {/* Modal trả lời */}
            <Modal
                open={modalOpen}
                title={`Phản hồi ${current?.MaPhanHoi || ''}`}
                onClose={() => setModalOpen(false)}
                width={580}
                footer={
                    <>
                        <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => setModalOpen(false)}
                            disabled={saving}
                        >
                            Đóng
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving
                                ? 'Đang gửi…'
                                : current?.TrangThaiXuLy === 'DaXuLy'
                                    ? 'Cập nhật phản hồi'
                                    : 'Gửi phản hồi'}
                        </button>
                    </>
                }
            >
                {formError && <div className="admin-form-error">{formError}</div>}

                {current && (
                    <>
                        {/* Đánh giá của khách */}
                        <div
                            style={{
                                background: '#f5f6fb',
                                borderRadius: 12,
                                padding: '14px 16px',
                                marginBottom: 16,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 8,
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>
                                    {current.TenKhachHang || current.MaKhachHang}
                                </div>
                                <Sao diem={current.DiemDanhGia} />
                            </div>
                            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                                {current.NoiDungCuaKhachHang}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                                {fmtDateTime(current.ThoiGian)}
                                {current.MaHoaDon && ` · Hóa đơn ${current.MaHoaDon}`}
                            </div>
                        </div>

                        {/* Đã trả lời trước đó */}
                        {current.TrangThaiXuLy === 'DaXuLy' && current.TenNhanVien && (
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                                Đã trả lời bởi <b>{current.TenNhanVien}</b> lúc{' '}
                                {fmtDateTime(current.ThoiGianPhanHoi)}
                            </div>
                        )}

                        <div className="admin-field">
                            <label>
                                Phản hồi của nhà hàng{' '}
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                    ({traLoi.length}/500)
                                </span>
                            </label>
                            <textarea
                                className="admin-input"
                                rows={4}
                                maxLength={500}
                                value={traLoi}
                                onChange={(e) => setTraLoi(e.target.value)}
                                placeholder="VD: Cảm ơn quý khách đã đánh giá. Nhà hàng sẽ cải thiện…"
                            />
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}