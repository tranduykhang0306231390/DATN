// src/pages/admin/QuanLyUuDai.jsx
import { useEffect, useState, useCallback } from 'react';
import '../../assets/css/admin.css';
import uuDaiApi from '../../api/uuDaiApi.js';
import Modal from '../../components/admin/Modal.jsx';

const NHOM_OPTIONS = [
    { value: 'GiamTien', label: 'Giảm tiền' },
    { value: 'PhanTram', label: 'Giảm %' },
    { value: 'TangMon', label: 'Tặng món' },
];

const nhomLabel = (v) => NHOM_OPTIONS.find((n) => n.value === v)?.label || v;

const EMPTY_FORM = {
    TenUuDai: '',
    NhomUuDai: 'GiamTien',
    GiaTriGiam: 0,
    SoDiemCanDoi: 0,
    SoLuongPhatHanh: 0,
    NgayBatDau: '',
    NgayKetThuc: '',
    MaHangThanhVien: '',
    ThuTuApDung: 1,
    CoTheDungChung: false,
    MoTa: '',
};

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function QuanLyUuDai() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [hangOptions, setHangOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [nhom, setNhom] = useState('');
    const [page, setPage] = useState(1);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // MaUuDai đang sửa, null = thêm mới
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(() => {
        setLoading(true);
        uuDaiApi
            .getAll({ search, trang_thai: trangThai, nhom, page, per_page: 10 })
            .then((res) => {
                if (res.data?.success) {
                    setList(res.data.data);
                    setPagination(res.data.pagination);
                }
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, trangThai, nhom, page]);

    useEffect(() => {
        uuDaiApi
            .getOptions()
            .then((res) => {
                if (res.data?.success) setHangOptions(res.data.data.hangThanhVien || []);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (ud) => {
        setEditing(ud.MaUuDai);
        setForm({
            TenUuDai: ud.TenUuDai ?? '',
            NhomUuDai: ud.NhomUuDai ?? 'GiamTien',
            GiaTriGiam: Number(ud.GiaTriGiam) || 0,
            SoDiemCanDoi: Number(ud.SoDiemCanDoi) || 0,
            SoLuongPhatHanh: Number(ud.SoLuongPhatHanh) || 0,
            NgayBatDau: (ud.NgayBatDau || '').slice(0, 10),
            NgayKetThuc: (ud.NgayKetThuc || '').slice(0, 10),
            MaHangThanhVien: ud.MaHangThanhVien ?? '',
            ThuTuApDung: Number(ud.ThuTuApDung) || 1,
            CoTheDungChung: !!ud.CoTheDungChung,
            MoTa: ud.MoTa ?? '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = {
            ...form,
            GiaTriGiam: Number(form.GiaTriGiam),
            SoDiemCanDoi: Number(form.SoDiemCanDoi),
            SoLuongPhatHanh: Number(form.SoLuongPhatHanh),
            ThuTuApDung: Number(form.ThuTuApDung),
            MaHangThanhVien: form.MaHangThanhVien || null,
        };
        try {
            if (editing) {
                await uuDaiApi.update(editing, payload);
            } else {
                await uuDaiApi.create(payload);
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

    const handleToggle = async (ud) => {
        const action = ud.TrangThai === 'HoatDong' ? 'ngừng' : 'kích hoạt';
        if (!window.confirm(`Bạn muốn ${action} ưu đãi "${ud.TenUuDai}"?`)) return;
        try {
            await uuDaiApi.toggleTrangThai(ud.MaUuDai);
            loadList();
        } catch {
            alert('Không thể đổi trạng thái ưu đãi');
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
                    <span className="admin-hero-eyebrow">Ưu đãi &amp; Voucher</span>
                    <h2 className="admin-hero-title">Quản lý ưu đãi</h2>
                    <p className="admin-hero-sub">
                        Tạo và điều chỉnh các ưu đãi để khách đổi điểm lấy voucher.
                    </p>
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openCreate}>
                        + Thêm ưu đãi
                    </button>
                </div>
            </header>

            {/* Thanh công cụ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo tên hoặc mã…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <select className="admin-select" value={nhom} onChange={(e) => setNhom(e.target.value)}>
                    <option value="">Tất cả nhóm</option>
                    {NHOM_OPTIONS.map((n) => (
                        <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                </select>
                <select
                    className="admin-select"
                    value={trangThai}
                    onChange={(e) => setTrangThai(e.target.value)}
                >
                    <option value="">Mọi trạng thái</option>
                    <option value="HoatDong">Đang hoạt động</option>
                    <option value="NgungApDung">Đã ngừng</option>
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
                            <th>Tên ưu đãi</th>
                            <th>Nhóm</th>
                            <th>Giá trị giảm</th>
                            <th>Điểm đổi</th>
                            <th>Tồn / Phát hành</th>
                            <th>Áp dụng hạng</th>
                            <th>Hiệu lực</th>
                            <th>Trạng thái</th>
                            <th className="admin-th-action">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={10} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="admin-state">Chưa có ưu đãi nào.</td>
                            </tr>
                        ) : (
                            list.map((ud) => (
                                <tr key={ud.MaUuDai}>
                                    <td className="admin-mono">{ud.MaUuDai}</td>
                                    <td>{ud.TenUuDai}</td>
                                    <td>{nhomLabel(ud.NhomUuDai)}</td>
                                    <td>
                                        {ud.NhomUuDai === 'PhanTram'
                                            ? `${ud.GiaTriGiam}%`
                                            : fmtMoney(ud.GiaTriGiam)}
                                    </td>
                                    <td>{ud.SoDiemCanDoi}</td>
                                    <td>
                                        {ud.SoLuongTon} / {ud.SoLuongPhatHanh}
                                    </td>
                                    <td>
                                        {ud.MaHangThanhVien
                                            ? (hangOptions.find((h) => h.MaHangThanhVien === ud.MaHangThanhVien)?.TenHang || ud.MaHangThanhVien)
                                            : 'Mọi hạng'}
                                    </td>
                                    <td className="admin-nowrap">
                                        {(ud.NgayBatDau || '').slice(0, 10)}<br />
                                        {(ud.NgayKetThuc || '').slice(0, 10)}
                                    </td>
                                    <td>
                                        <span
                                            className={`admin-badge ${ud.TrangThai === 'HoatDong' ? 'admin-badge--on' : 'admin-badge--off'}`}
                                        >
                                            {ud.TrangThai === 'HoatDong' ? 'Đang chạy' : 'Đã ngừng'}
                                        </span>
                                    </td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                                onClick={() => openEdit(ud)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className={`admin-btn admin-btn--sm ${ud.TrangThai === 'HoatDong' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                                                onClick={() => handleToggle(ud)}
                                            >
                                                {ud.TrangThai === 'HoatDong' ? 'Ngừng' : 'Mở'}
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} ưu đãi
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
                title={editing ? `Sửa ưu đãi ${editing}` : 'Thêm ưu đãi mới'}
                onClose={() => setModalOpen(false)}
                width={620}
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
                        <label>Tên ưu đãi</label>
                        <input
                            className="admin-input"
                            value={form.TenUuDai}
                            onChange={(e) => setField('TenUuDai', e.target.value)}
                            placeholder="VD: Giảm 50.000đ"
                        />
                    </div>

                    <div className="admin-field">
                        <label>Nhóm ưu đãi</label>
                        <select
                            className="admin-select"
                            value={form.NhomUuDai}
                            onChange={(e) => setField('NhomUuDai', e.target.value)}
                        >
                            {NHOM_OPTIONS.map((n) => (
                                <option key={n.value} value={n.value}>{n.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-field">
                        <label>
                            {form.NhomUuDai === 'PhanTram' ? 'Phần trăm giảm (%)' : 'Giá trị giảm (đ)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.GiaTriGiam}
                            onChange={(e) => setField('GiaTriGiam', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Điểm cần để đổi</label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.SoDiemCanDoi}
                            onChange={(e) => setField('SoDiemCanDoi', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Số lượng phát hành</label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.SoLuongPhatHanh}
                            onChange={(e) => setField('SoLuongPhatHanh', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Ngày bắt đầu</label>
                        <input
                            type="date"
                            className="admin-input"
                            value={form.NgayBatDau}
                            onChange={(e) => setField('NgayBatDau', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Ngày kết thúc</label>
                        <input
                            type="date"
                            className="admin-input"
                            value={form.NgayKetThuc}
                            onChange={(e) => setField('NgayKetThuc', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Áp dụng cho hạng</label>
                        <select
                            className="admin-select"
                            value={form.MaHangThanhVien}
                            onChange={(e) => setField('MaHangThanhVien', e.target.value)}
                        >
                            <option value="">Mọi hạng</option>
                            {hangOptions.map((h) => (
                                <option key={h.MaHangThanhVien} value={h.MaHangThanhVien}>
                                    {h.TenHang}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-field">
                        <label>Thứ tự áp dụng</label>
                        <input
                            type="number"
                            min="1"
                            className="admin-input"
                            value={form.ThuTuApDung}
                            onChange={(e) => setField('ThuTuApDung', e.target.value)}
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label className="admin-checkbox">
                            <input
                                type="checkbox"
                                checked={form.CoTheDungChung}
                                onChange={(e) => setField('CoTheDungChung', e.target.checked)}
                            />
                            Có thể dùng chung với ưu đãi khác cùng nhóm
                        </label>
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>Mô tả</label>
                        <textarea
                            className="admin-input"
                            rows={2}
                            value={form.MoTa}
                            onChange={(e) => setField('MoTa', e.target.value)}
                            placeholder="Mô tả ngắn về ưu đãi"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}