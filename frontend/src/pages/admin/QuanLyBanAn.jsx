// src/pages/admin/QuanLyBanAn.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import banAnApi from '../../api/banAnApi';
import Modal from '../../components/admin/Modal';

const TRANG_THAI_OPTIONS = [
    { value: 'HoatDong', label: 'Đang hoạt động' },
    { value: 'BaoTri', label: 'Bảo trì' },
    { value: 'NgungPhucVu', label: 'Ngừng phục vụ' },
];

const trangThaiLabel = (v) => TRANG_THAI_OPTIONS.find((t) => t.value === v)?.label || v;
const trangThaiBadgeClass = (v) => {
    if (v === 'HoatDong') return 'admin-badge--on';
    if (v === 'BaoTri') return 'admin-badge--warn';
    return 'admin-badge--off';
};

const EMPTY_FORM = {
    TenBan: '',
    KhuVuc: '',
    SucChua: 4,
    TrangThai: 'HoatDong',
};

export default function QuanLyBanAn() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [khuVuc, setKhuVuc] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [page, setPage] = useState(1);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // MaBan đang sửa, null = thêm mới
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        banAnApi
            .getAll({
                search,
                khu_vuc: khuVuc,
                trang_thai: trangThai,
                page,
                per_page: 10,
            })
            .then((res) => {
                if (res.data?.success) {
                    setList(res.data.data);
                    setPagination(res.data.pagination);
                }
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, khuVuc, trangThai, page]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void loadList(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadList]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (ban) => {
        setEditing(ban.MaBan);
        setForm({
            TenBan: ban.TenBan ?? '',
            KhuVuc: ban.KhuVuc ?? '',
            SucChua: Number(ban.SucChua) || 1,
            TrangThai: ban.TrangThai ?? 'HoatDong',
        });
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = { ...form, SucChua: Number(form.SucChua) };
        try {
            if (editing) {
                await banAnApi.update(editing, payload);
            } else {
                await banAnApi.create(payload);
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

    const handleChangeTrangThai = async (ban, trangThaiMoi) => {
        if (trangThaiMoi === ban.TrangThai) return;
        const confirm = await Swal.fire({
            title: `Đổi trạng thái bàn ${ban.MaBan}?`,
            text: `"${ban.TenBan}" sẽ chuyển sang "${trangThaiLabel(trangThaiMoi)}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Không',
            confirmButtonColor: '#4f46e5',
        });
        if (!confirm.isConfirmed) return;
        try {
            await banAnApi.capNhatTrangThai(ban.MaBan, trangThaiMoi);
            Swal.fire({
                icon: 'success',
                title: 'Đã cập nhật trạng thái',
                timer: 1500,
                showConfirmButton: false,
            });
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể đổi trạng thái', 'error');
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
                    <h2 className="admin-hero-title">Quản lý bàn ăn</h2>
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openCreate}>
                        + Thêm bàn ăn
                    </button>
                </div>
            </header>

            {/* Thanh công cụ */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo tên, mã hoặc khu vực…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <input
                    className="admin-input"
                    placeholder="Lọc theo khu vực…"
                    value={khuVuc}
                    onChange={(e) => setKhuVuc(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <select
                    className="admin-select"
                    value={trangThai}
                    onChange={(e) => setTrangThai(e.target.value)}
                >
                    <option value="">Mọi trạng thái</option>
                    {TRANG_THAI_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
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
                            <th>Mã</th>
                            <th>Tên bàn</th>
                            <th>Khu vực</th>
                            <th>Sức chứa</th>
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
                                <td colSpan={6} className="admin-state">Chưa có bàn ăn nào.</td>
                            </tr>
                        ) : (
                            list.map((ban) => (
                                <tr key={ban.MaBan}>
                                    <td className="admin-mono">{ban.MaBan}</td>
                                    <td>{ban.TenBan}</td>
                                    <td>{ban.KhuVuc}</td>
                                    <td>{ban.SucChua} khách</td>
                                    <td>
                                        <span className={`admin-badge ${trangThaiBadgeClass(ban.TrangThai)}`}>
                                            {trangThaiLabel(ban.TrangThai)}
                                        </span>
                                    </td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                                onClick={() => openEdit(ban)}
                                            >
                                                Sửa
                                            </button>
                                            <select
                                                className="admin-select admin-select--sm"
                                                value={ban.TrangThai}
                                                onChange={(e) => handleChangeTrangThai(ban, e.target.value)}
                                            >
                                                {TRANG_THAI_OPTIONS.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} bàn ăn
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
                title={editing ? `Sửa bàn ăn ${editing}` : 'Thêm bàn ăn mới'}
                onClose={() => setModalOpen(false)}
                width={480}
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
                    <div className="admin-field admin-field--full">
                        <label>Tên bàn</label>
                        <input
                            className="admin-input"
                            value={form.TenBan}
                            onChange={(e) => setField('TenBan', e.target.value)}
                            placeholder="VD: Bàn 12"
                        />
                    </div>

                    <div className="admin-field">
                        <label>Khu vực</label>
                        <input
                            className="admin-input"
                            value={form.KhuVuc}
                            onChange={(e) => setField('KhuVuc', e.target.value)}
                            placeholder="VD: Tầng 1"
                        />
                    </div>

                    <div className="admin-field">
                        <label>Sức chứa (khách)</label>
                        <input
                            type="number"
                            min="1"
                            className="admin-input"
                            value={form.SucChua}
                            onChange={(e) => setField('SucChua', e.target.value)}
                        />
                    </div>

                    {editing && (
                        <div className="admin-field admin-field--full">
                            <label>Trạng thái</label>
                            <select
                                className="admin-select"
                                value={form.TrangThai}
                                onChange={(e) => setField('TrangThai', e.target.value)}
                            >
                                {TRANG_THAI_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
