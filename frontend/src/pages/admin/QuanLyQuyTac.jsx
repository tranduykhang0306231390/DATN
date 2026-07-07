// src/pages/admin/QuanLyQuyTac.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import quyTacApi from '../../api/quyTacApi';
import Modal from '../../components/admin/Modal';

const EMPTY_FORM = {
    SoTienQuyDoi: 10000,
    SoDiemNhan: 1,
    NgayApDung: '',
    NgayHetHan: '',
    GhiChu: '',
};

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const trangThaiLabel = (tt) =>
    tt === 'HoatDong' ? 'Đang áp dụng' : tt === 'HetHan' ? 'Hết hạn' : 'Đã ngừng';

export default function QuanLyQuyTac() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [page, setPage] = useState(1);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // MaQuyTac đang sửa, null = thêm mới
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(() => {
        setLoading(true);
        quyTacApi
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
        loadList();
    }, [loadList]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (qt) => {
        setEditing(qt.MaQuyTac);
        setForm({
            SoTienQuyDoi: Number(qt.SoTienQuyDoi) || 0,
            SoDiemNhan: Number(qt.SoDiemNhan) || 0,
            NgayApDung: (qt.NgayApDung || '').slice(0, 10),
            NgayHetHan: (qt.NgayHetHan || '').slice(0, 10),
            GhiChu: '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = {
            SoTienQuyDoi: Number(form.SoTienQuyDoi),
            SoDiemNhan: Number(form.SoDiemNhan),
            NgayApDung: form.NgayApDung,
            NgayHetHan: form.NgayHetHan || null,
            GhiChu: form.GhiChu || null,
        };
        try {
            if (editing) {
                await quyTacApi.update(editing, payload);
            } else {
                await quyTacApi.create(payload);
                setPage(1);
            }
            setModalOpen(false);
            loadList();
        } catch (err) {
            const res = err.response?.data;
            const firstErr = res?.errors ? Object.values(res.errors)[0]?.[0] : null;
            setFormError(firstErr || res?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (qt) => {
        const dangHoatDong = qt.TrangThai === 'HoatDong';
        const confirm = await Swal.fire({
            title: `${dangHoatDong ? 'Ngừng' : 'Kích hoạt'} quy tắc ${qt.MaQuyTac}?`,
            text: dangHoatDong
                ? 'Quy tắc sẽ ngừng áp dụng cho các giao dịch mới.'
                : 'Quy tắc sẽ được kích hoạt lại.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Không',
            confirmButtonColor: dangHoatDong ? '#dc2626' : '#4f46e5',
        });
        if (!confirm.isConfirmed) return;
        try {
            await quyTacApi.toggleTrangThai(qt.MaQuyTac);
            Swal.fire({
                icon: 'success',
                title: dangHoatDong ? 'Đã ngừng quy tắc' : 'Đã kích hoạt quy tắc',
                timer: 1500,
                showConfirmButton: false,
            });
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể đổi trạng thái', 'error');
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
                    <span className="admin-hero-eyebrow">Ưu đãi &amp; tích điểm</span>
                    <h2 className="admin-hero-title">Quản lý quy tắc tích điểm</h2>
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openCreate}>
                        + Thêm quy tắc
                    </button>
                </div>
            </header>

            {/* Thanh công cụ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo mã…"
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
                    <option value="HoatDong">Đang áp dụng</option>
                    <option value="NgungApDung">Đã ngừng</option>
                    <option value="HetHan">Hết hạn</option>
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
                            <th>Quy đổi</th>
                            <th>Ngày áp dụng</th>
                            <th>Ngày hết hạn</th>
                            <th>Trạng thái</th>
                            <th className="admin-th-action">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="admin-state">Chưa có quy tắc nào.</td>
                            </tr>
                        ) : (
                            list.map((qt) => (
                                <tr key={qt.MaQuyTac}>
                                    <td className="admin-mono">{qt.MaQuyTac}</td>
                                    <td>
                                        {fmtMoney(qt.SoTienQuyDoi)} = <b>{qt.SoDiemNhan}</b> điểm
                                    </td>
                                    <td className="admin-nowrap">{(qt.NgayApDung || '').slice(0, 10)}</td>
                                    <td className="admin-nowrap">
                                        {qt.NgayHetHan ? qt.NgayHetHan.slice(0, 10) : 'Không giới hạn'}
                                    </td>
                                    <td>
                                        <span
                                            className={`admin-badge ${qt.TrangThai === 'HoatDong' ? 'admin-badge--on' : 'admin-badge--off'}`}
                                        >
                                            {trangThaiLabel(qt.TrangThai)}
                                        </span>
                                    </td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                                onClick={() => openEdit(qt)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className={`admin-btn admin-btn--sm ${qt.TrangThai === 'HoatDong' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                                                onClick={() => handleToggle(qt)}
                                            >
                                                {qt.TrangThai === 'HoatDong' ? 'Ngừng' : 'Mở'}
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} quy tắc
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

            {/* Modal thêm / sửa */}
            <Modal
                open={modalOpen}
                title={editing ? `Sửa quy tắc ${editing}` : 'Thêm quy tắc mới'}
                onClose={() => setModalOpen(false)}
                width={520}
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
                            {saving ? 'Đang lưu…' : 'Lưu'}
                        </button>
                    </>
                }
            >
                {formError && <div className="admin-form-error">{formError}</div>}

                <div className="admin-form">
                    <div className="admin-field">
                        <label>Số tiền quy đổi (đ)</label>
                        <input
                            type="number"
                            min="1"
                            className="admin-input"
                            value={form.SoTienQuyDoi}
                            onChange={(e) => setField('SoTienQuyDoi', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Số điểm nhận</label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.SoDiemNhan}
                            onChange={(e) => setField('SoDiemNhan', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Ngày áp dụng</label>
                        <input
                            type="date"
                            className="admin-input"
                            value={form.NgayApDung}
                            max={form.NgayHetHan || undefined}
                            onChange={(e) => setField('NgayApDung', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Ngày hết hạn (tùy chọn)</label>
                        <input
                            type="date"
                            className="admin-input"
                            value={form.NgayHetHan}
                            min={form.NgayApDung || undefined}
                            onChange={(e) => setField('NgayHetHan', e.target.value)}
                        />
                    </div>

                    {editing && (
                        <div className="admin-field admin-field--full">
                            <label>
                                Ghi chú thay đổi{' '}
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                    
                                </span>
                            </label>
                            <input
                                className="admin-input"
                                value={form.GhiChu}
                                onChange={(e) => setField('GhiChu', e.target.value)}
                                placeholder="VD: Tăng ưu đãi tích điểm dịp lễ"
                            />
                        </div>
                    )}

                    <div className="admin-field admin-field--full">
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            Nghĩa là: cứ <b>{fmtMoney(form.SoTienQuyDoi)}</b> khách chi tiêu thì
                            nhận <b>{form.SoDiemNhan || 0}</b> điểm.
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}