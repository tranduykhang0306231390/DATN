// src/pages/admin/QuanLyThongBao.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import thongBaoApi from '../../api/thongBaoApi';
import Modal from '../../components/admin/Modal';

const DOI_TUONG = [
    { value: 'TheoHang', label: 'Theo hạng thành viên' },
    { value: 'TatCa', label: 'Tất cả khách hàng' },
];

const EMPTY_FORM = {
    TieuDe: '',
    NoiDung: '',
    doi_tuong: 'TheoHang',
    ma_hang: '',
};

const fmtDateTime = (s) => {
    if (!s) return '—';
    const d = new Date(String(s).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString('vi-VN');
};

export default function QuanLyThongBao() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [hangOptions, setHangOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [page, setPage] = useState(1);

    // Modal gửi
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        thongBaoApi
            .getAll({ search, trang_thai: trangThai, page, per_page: 10 })
            .then((res) => {
                if (res.data?.success) {
                    setList(res.data.data);
                    setPagination(res.data.pagination);
                }
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, trangThai, page]);

    useEffect(() => {
        thongBaoApi
            .getOptions()
            .then((res) => {
                if (res.data?.success) {
                    setHangOptions(res.data.data.hangThanhVien || []);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void loadList(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadList]);

    const openSend = () => {
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = {
            TieuDe: form.TieuDe,
            NoiDung: form.NoiDung,
            doi_tuong: form.doi_tuong,
            ma_hang: form.doi_tuong === 'TheoHang' ? form.ma_hang : null,
        };
        try {
            const res = await thongBaoApi.send(payload);
            setModalOpen(false);
            if (page === 1) void loadList();
            else setPage(1);
            Swal.fire({
                icon: 'success',
                title: 'Đã gửi thông báo',
                text: res.data?.message || '',
                timer: 1800,
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
        if (page === 1) void loadList();
        else setPage(1);
    };

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Khách hàng &amp; thành viên</span>
                    <h2 className="admin-hero-title">Quản lý thông báo</h2> 
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openSend}>
                        Gửi thông báo
                    </button>
                </div>
            </header>

            {/* Thanh công cụ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo tiêu đề, nội dung hoặc mã…"
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
                    <option value="ChuaDoc">Chưa đọc</option>
                    <option value="DaDoc">Đã đọc</option>
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
                            <th>Tiêu đề</th>
                            <th>Nội dung</th>
                            <th>Khách hàng</th>
                            <th>Trạng thái</th>
                            <th>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="admin-state">Chưa có thông báo nào.</td>
                            </tr>
                        ) : (
                            list.map((tb) => (
                                <tr key={tb.MaThongBao}>
                                    <td className="admin-mono">{tb.MaThongBao}</td>
                                    <td style={{ fontWeight: 600 }}>{tb.TieuDe}</td>
                                    <td style={{ maxWidth: 320, color: '#64748b' }}>{tb.NoiDung}</td>
                                    <td>
                                        <div>{tb.TenKhachHang || tb.MaKhachHang}</div>
                                        <div className="admin-mono" style={{ fontSize: 12 }}>{tb.MaKhachHang}</div>
                                    </td>
                                    <td>
                                        <span
                                            className={`admin-badge ${tb.TrangThai === 'DaDoc' ? 'admin-badge--off' : 'admin-badge--on'}`}
                                        >
                                            {tb.TrangThai === 'DaDoc' ? 'Đã đọc' : 'Chưa đọc'}
                                        </span>
                                    </td>
                                    <td className="admin-nowrap">{fmtDateTime(tb.ThoiGian)}</td>
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} thông báo
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

            {/* Modal gửi thông báo */}
            <Modal
                open={modalOpen}
                title="Gửi thông báo mới"
                onClose={() => setModalOpen(false)}
                width={560}
                footer={
                    <>
                        <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => setModalOpen(false)}
                            disabled={saving}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Đang gửi…' : 'Gửi'}
                        </button>
                    </>
                }
            >
                {formError && <div className="admin-form-error">{formError}</div>}

                <div className="admin-form">
                    <div className="admin-field admin-field--full">
                        <label>Gửi tới</label>
                        <select
                            className="admin-select"
                            value={form.doi_tuong}
                            onChange={(e) => setField('doi_tuong', e.target.value)}
                        >
                            {DOI_TUONG.map((d) => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>

                    {form.doi_tuong === 'TheoHang' && (
                        <div className="admin-field admin-field--full">
                            <label>Chọn hạng thành viên</label>
                            <select
                                className="admin-select"
                                value={form.ma_hang}
                                onChange={(e) => setField('ma_hang', e.target.value)}
                            >
                                <option value="">-- Chọn hạng --</option>
                                {hangOptions.map((h) => (
                                    <option key={h.MaHangThanhVien} value={h.MaHangThanhVien}>
                                        {h.TenHang}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                  

                    <div className="admin-field admin-field--full">
                        <label>Tiêu đề</label>
                        <input
                            className="admin-input"
                            value={form.TieuDe}
                            onChange={(e) => setField('TieuDe', e.target.value)}
                            placeholder="VD: Ưu đãi mới tháng này"
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>
                            Nội dung{' '}
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                ({form.NoiDung.length}/500)
                            </span>
                        </label>
                        <textarea
                            className="admin-input"
                            rows={4}
                            maxLength={500}
                            value={form.NoiDung}
                            onChange={(e) => setField('NoiDung', e.target.value)}
                            placeholder="Nội dung thông báo gửi tới khách hàng"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
