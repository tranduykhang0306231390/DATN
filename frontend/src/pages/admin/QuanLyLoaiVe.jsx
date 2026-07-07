// src/pages/admin/QuanLyLoaiVe.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import loaiVeApi from '../../api/loaiVeApi';
import Modal from '../../components/admin/Modal';

const BUOI_OPTIONS = [
    { value: 'Trua', label: 'Trưa' },
    { value: 'Toi', label: 'Tối' },
];
const NGAY_OPTIONS = [
    { value: 'NgayThuong', label: 'Ngày thường' },
    { value: 'CuoiTuan', label: 'Cuối tuần' },
];

const buoiLabel = (v) => BUOI_OPTIONS.find((b) => b.value === v)?.label || v;
const ngayLabel = (v) => NGAY_OPTIONS.find((n) => n.value === v)?.label || v;

const EMPTY_FORM = {
    TenLoaiVe: '',
    BuoiAn: 'Trua',
    LoaiNgay: 'NgayThuong',
    GiaVe: 0,
    TrangThai: 'HoatDong', // giữ trong payload để qua validate update; đổi bằng nút Ngừng/Mở
};

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function QuanLyLoaiVe() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [buoiAn, setBuoiAn] = useState('');
    const [loaiNgay, setLoaiNgay] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [page, setPage] = useState(1);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // MaLoaiVe đang sửa, null = thêm mới
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(() => {
        setLoading(true);
        loaiVeApi
            .getAll({
                search,
                buoi_an: buoiAn,
                loai_ngay: loaiNgay,
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
    }, [search, buoiAn, loaiNgay, trangThai, page]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (lv) => {
        setEditing(lv.MaLoaiVe);
        setForm({
            TenLoaiVe: lv.TenLoaiVe ?? '',
            BuoiAn: lv.BuoiAn ?? 'Trua',
            LoaiNgay: lv.LoaiNgay ?? 'NgayThuong',
            GiaVe: Number(lv.GiaVe) || 0,
            TrangThai: lv.TrangThai ?? 'HoatDong',
        });
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = { ...form, GiaVe: Number(form.GiaVe) };
        try {
            if (editing) {
                await loaiVeApi.update(editing, payload);
            } else {
                await loaiVeApi.create(payload);
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

    const handleToggle = async (lv) => {
        const dangBan = lv.TrangThai === 'HoatDong';
        const confirm = await Swal.fire({
            title: `${dangBan ? 'Ngừng bán' : 'Mở bán'} loại vé ${lv.MaLoaiVe}?`,
            text: `Loại vé "${lv.TenLoaiVe}" sẽ được ${dangBan ? 'ngừng bán' : 'mở bán lại'}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Không',
            confirmButtonColor: dangBan ? '#dc2626' : '#4f46e5',
        });
        if (!confirm.isConfirmed) return;
        try {
            await loaiVeApi.toggleTrangThai(lv.MaLoaiVe);
            Swal.fire({
                icon: 'success',
                title: dangBan ? 'Đã ngừng bán' : 'Đã mở bán',
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
                    <span className="admin-hero-eyebrow">Vận hành</span>
                    <h2 className="admin-hero-title">Quản lý loại vé</h2>
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openCreate}>
                        + Thêm loại vé
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
                <select className="admin-select" value={buoiAn} onChange={(e) => setBuoiAn(e.target.value)}>
                    <option value="">Tất cả buổi</option>
                    {BUOI_OPTIONS.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                </select>
                <select className="admin-select" value={loaiNgay} onChange={(e) => setLoaiNgay(e.target.value)}>
                    <option value="">Tất cả ngày</option>
                    {NGAY_OPTIONS.map((n) => (
                        <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                </select>
                <select
                    className="admin-select"
                    value={trangThai}
                    onChange={(e) => setTrangThai(e.target.value)}
                >
                    <option value="">Mọi trạng thái</option>
                    <option value="HoatDong">Đang bán</option>
                    <option value="TamNgung">Ngừng bán</option>
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
                            <th>Tên loại vé</th>
                            <th>Buổi ăn</th>
                            <th>Loại ngày</th>
                            <th>Giá vé</th>
                            <th>Trạng thái</th>
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
                                <td colSpan={7} className="admin-state">Chưa có loại vé nào.</td>
                            </tr>
                        ) : (
                            list.map((lv) => (
                                <tr key={lv.MaLoaiVe}>
                                    <td className="admin-mono">{lv.MaLoaiVe}</td>
                                    <td>{lv.TenLoaiVe}</td>
                                    <td>{buoiLabel(lv.BuoiAn)}</td>
                                    <td>{ngayLabel(lv.LoaiNgay)}</td>
                                    <td>{fmtMoney(lv.GiaVe)}</td>
                                    <td>
                                        <span
                                            className={`admin-badge ${lv.TrangThai === 'HoatDong' ? 'admin-badge--on' : 'admin-badge--off'}`}
                                        >
                                            {lv.TrangThai === 'HoatDong' ? 'Đang bán' : 'Ngừng bán'}
                                        </span>
                                    </td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                                onClick={() => openEdit(lv)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className={`admin-btn admin-btn--sm ${lv.TrangThai === 'HoatDong' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                                                onClick={() => handleToggle(lv)}
                                            >
                                                {lv.TrangThai === 'HoatDong' ? 'Ngừng' : 'Mở'}
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} loại vé
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
                title={editing ? `Sửa loại vé ${editing}` : 'Thêm loại vé mới'}
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
                    <div className="admin-field admin-field--full">
                        <label>Tên loại vé</label>
                        <input
                            className="admin-input"
                            value={form.TenLoaiVe}
                            onChange={(e) => setField('TenLoaiVe', e.target.value)}
                            placeholder="VD: Vé buffet trưa người lớn ngày thường"
                        />
                    </div>

                    <div className="admin-field">
                        <label>Buổi ăn</label>
                        <select
                            className="admin-select"
                            value={form.BuoiAn}
                            onChange={(e) => setField('BuoiAn', e.target.value)}
                        >
                            {BUOI_OPTIONS.map((b) => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-field">
                        <label>Loại ngày</label>
                        <select
                            className="admin-select"
                            value={form.LoaiNgay}
                            onChange={(e) => setField('LoaiNgay', e.target.value)}
                        >
                            {NGAY_OPTIONS.map((n) => (
                                <option key={n.value} value={n.value}>{n.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>Giá vé (đ)</label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.GiaVe}
                            onChange={(e) => setField('GiaVe', e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}