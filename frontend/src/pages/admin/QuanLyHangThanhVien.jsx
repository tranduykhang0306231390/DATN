// src/pages/admin/QuanLyHangThanhVien.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import hangThanhVienApi from '../../api/hangThanhVienApi';
import Modal from '../../components/admin/Modal';

const EMPTY_FORM = {
    TenHang: '',
    MoTa: '',
    TongChiTieuToiThieu: 0,
    DiemToiThieu: 0,
    ThuTuHang: 1,
    MaQuyTac: '',
};

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function QuanLyHangThanhVien() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [quyTacOptions, setQuyTacOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        hangThanhVienApi
            .getAll({ search, page, per_page: 10 })
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
        hangThanhVienApi
            .getOptions()
            .then((res) => {
                if (res.data?.success) setQuyTacOptions(res.data.data.quyTac || []);
            })
            .catch(() => {});
    }, []);

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

    const openEdit = (htv) => {
        setEditing(htv.MaHangThanhVien);
        setForm({
            TenHang: htv.TenHang ?? '',
            MoTa: htv.MoTa ?? '',
            TongChiTieuToiThieu: Number(htv.TongChiTieuToiThieu) || 0,
            DiemToiThieu: Number(htv.DiemToiThieu) || 0,
            ThuTuHang: Number(htv.ThuTuHang) || 1,
            MaQuyTac: htv.MaQuyTac ?? '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = {
            TenHang: form.TenHang,
            MoTa: form.MoTa || null,
            TongChiTieuToiThieu: Number(form.TongChiTieuToiThieu),
            DiemToiThieu: Number(form.DiemToiThieu),
            ThuTuHang: Number(form.ThuTuHang),
            MaQuyTac: form.MaQuyTac,
        };
        try {
            if (editing) {
                await hangThanhVienApi.update(editing, payload);
            } else {
                await hangThanhVienApi.create(payload);
            }
            setModalOpen(false);
            loadList();
            Swal.fire({
                icon: 'success',
                title: editing ? 'Đã cập nhật hạng' : 'Đã thêm hạng',
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

    const handleDelete = async (htv) => {
        const confirm = await Swal.fire({
            title: `Xóa hạng "${htv.TenHang}"?`,
            text: 'Chỉ xóa được khi chưa có khách hàng nào thuộc hạng này.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Không',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;
        try {
            await hangThanhVienApi.remove(htv.MaHangThanhVien);
            Swal.fire({ icon: 'success', title: 'Đã xóa hạng', timer: 1500, showConfirmButton: false });
            loadList();
        } catch (e) {
            Swal.fire('Không thể xóa', e.response?.data?.message || 'Hạng đang được sử dụng', 'error');
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
                    <h2 className="admin-hero-title">Quản lý hạng thành viên</h2>
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openCreate}>
                        + Thêm hạng
                    </button>
                </div>
            </header>

            {/* Thanh công cụ */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo tên hoặc mã…"
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
                            <th>Mã</th>
                            <th>Thứ tự</th>
                            <th>Tên hạng</th>
                            <th>Chi tiêu tối thiểu</th>
                            <th>Điểm tối thiểu</th>
                            <th>Quy tắc</th>
                            <th className="admin-th-action">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="admin-state">Chưa có hạng nào.</td>
                            </tr>
                        ) : (
                            list.map((htv) => (
                                <tr key={htv.MaHangThanhVien}>
                                    <td className="admin-mono">{htv.MaHangThanhVien}</td>
                                    <td>{htv.ThuTuHang}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{htv.TenHang}</div>
                                        {htv.MoTa && (
                                            <div style={{ fontSize: 12, color: '#64748b' }}>{htv.MoTa}</div>
                                        )}
                                    </td>
                                    <td>{fmtMoney(htv.TongChiTieuToiThieu)}</td>
                                    <td>{Number(htv.DiemToiThieu).toLocaleString('vi-VN')} điểm</td>
                                    <td className="admin-mono">{htv.MaQuyTac}</td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                                onClick={() => openEdit(htv)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--danger admin-btn--sm"
                                                onClick={() => handleDelete(htv)}
                                            >
                                                Xóa
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} hạng
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
                title={editing ? `Sửa hạng ${editing}` : 'Thêm hạng mới'}
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
                            {saving ? 'Đang lưu…' : 'Lưu'}
                        </button>
                    </>
                }
            >
                {formError && <div className="admin-form-error">{formError}</div>}

                <div className="admin-form">
                    <div className="admin-field admin-field--full">
                        <label>Tên hạng</label>
                        <input
                            className="admin-input"
                            value={form.TenHang}
                            onChange={(e) => setField('TenHang', e.target.value)}
                            placeholder="VD: Vàng, Bạc, Kim cương…"
                        />
                    </div>

                    <div className="admin-field">
                        <label>Thứ tự hạng</label>
                        <input
                            type="number"
                            min="1"
                            className="admin-input"
                            value={form.ThuTuHang}
                            onChange={(e) => setField('ThuTuHang', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Quy tắc tích điểm</label>
                        <select
                            className="admin-select"
                            value={form.MaQuyTac}
                            onChange={(e) => setField('MaQuyTac', e.target.value)}
                        >
                            <option value="">-- Chọn quy tắc --</option>
                            {quyTacOptions.map((q) => (
                                <option key={q.MaQuyTac} value={q.MaQuyTac}>
                                    {q.MaQuyTac} ({fmtMoney(q.SoTienQuyDoi)} = {q.SoDiemNhan}đ)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-field">
                        <label>Chi tiêu tối thiểu (đ)</label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.TongChiTieuToiThieu}
                            onChange={(e) => setField('TongChiTieuToiThieu', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Điểm tối thiểu</label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.DiemToiThieu}
                            onChange={(e) => setField('DiemToiThieu', e.target.value)}
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>Mô tả (tùy chọn)</label>
                        <textarea
                            className="admin-input"
                            rows={2}
                            value={form.MoTa}
                            onChange={(e) => setField('MoTa', e.target.value)}
                            placeholder="Mô tả ngắn về hạng"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
