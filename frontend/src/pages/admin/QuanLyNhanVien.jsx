// src/pages/admin/QuanLyNhanVien.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import nhanVienApi from '../../api/nhanVienApi';
import Modal from '../../components/admin/Modal';
import { getStoredObject } from '../../utils/storage';

const EMPTY_FORM = {
    TenDangNhap: '',
    MatKhau: '',
    HoTen: '',
    TrangThai: 'HoatDong',
};

export default function QuanLyNhanVien() {
    const currentUser = getStoredObject('user');

    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [page, setPage] = useState(1);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        nhanVienApi
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
        const timeoutId = window.setTimeout(() => void loadList(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadList]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (nv) => {
        setEditing(nv.MaNhanVien);
        setForm({
            TenDangNhap: nv.TenDangNhap ?? '',
            MatKhau: '', // để trống = giữ mật khẩu cũ
            HoTen: nv.HoTen ?? '',
            TrangThai: nv.TrangThai ?? 'HoatDong',
        });
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = {
            TenDangNhap: form.TenDangNhap,
            MatKhau: form.MatKhau,
            HoTen: form.HoTen,
            TrangThai: form.TrangThai,
        };
        try {
            if (editing) {
                await nhanVienApi.update(editing, payload);
            } else {
                await nhanVienApi.create(payload);
                setPage(1);
            }
            setModalOpen(false);
            loadList();
            Swal.fire({
                icon: 'success',
                title: editing ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên',
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

    const handleToggle = async (nv) => {
        const dangHoatDong = nv.TrangThai === 'HoatDong';
        const confirm = await Swal.fire({
            title: `${dangHoatDong ? 'Khóa' : 'Mở khóa'} nhân viên ${nv.HoTen}?`,
            text: dangHoatDong
                ? 'Nhân viên sẽ không đăng nhập được cho tới khi mở lại.'
                : 'Nhân viên sẽ đăng nhập lại được bình thường.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Không',
            confirmButtonColor: dangHoatDong ? '#dc2626' : '#4f46e5',
        });
        if (!confirm.isConfirmed) return;
        try {
            await nhanVienApi.toggleTrangThai(nv.MaNhanVien);
            Swal.fire({
                icon: 'success',
                title: dangHoatDong ? 'Đã khóa nhân viên' : 'Đã mở khóa',
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
                    <span className="admin-hero-eyebrow">Hệ thống</span>
                    <h2 className="admin-hero-title">Quản lý nhân viên</h2>
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openCreate}>
                        + Thêm nhân viên
                    </button>
                </div>
            </header>

            {/* Thanh công cụ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo tên, tài khoản hoặc mã…"
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
                    <option value="HoatDong">Đang hoạt động</option>
                    <option value="TamKhoa">Đã khóa</option>
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
                            <th>Tên đăng nhập</th>
                            <th>Họ tên</th>
                            <th>Trạng thái</th>
                            <th className="admin-th-action">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="admin-state">Chưa có nhân viên nào.</td>
                            </tr>
                        ) : (
                            list.map((nv) => {
                                const laChinhMinh = nv.MaNhanVien === currentUser.MaNhanVien;
                                return (
                                    <tr key={nv.MaNhanVien}>
                                        <td className="admin-mono">{nv.MaNhanVien}</td>
                                        <td>{nv.TenDangNhap}</td>
                                        <td>
                                            {nv.HoTen}
                                        </td>
                                        <td>
                                            <span
                                                className={`admin-badge ${nv.TrangThai === 'HoatDong' ? 'admin-badge--on' : 'admin-badge--off'}`}
                                            >
                                                {nv.TrangThai === 'HoatDong' ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="admin-th-action">
                                            <div className="admin-row-actions">
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn--ghost admin-btn--sm"
                                                    onClick={() => openEdit(nv)}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`admin-btn admin-btn--sm ${nv.TrangThai === 'HoatDong' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                                                    onClick={() => handleToggle(nv)}
                                                    disabled={laChinhMinh}
                                                >
                                                    {nv.TrangThai === 'HoatDong' ? 'Khóa' : 'Mở'}
                                                </button>
                                            </div>
                                        </td>
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} nhân viên
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
                title={editing ? `Sửa nhân viên ${editing}` : 'Thêm nhân viên mới'}
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
                        <label>Họ tên</label>
                        <input
                            className="admin-input"
                            value={form.HoTen}
                            onChange={(e) => setField('HoTen', e.target.value)}
                            placeholder="VD: Nguyễn Văn A"
                        />
                    </div>

                    <div className="admin-field">
                        <label>Tên đăng nhập</label>
                        <input
                            className="admin-input"
                            value={form.TenDangNhap}
                            onChange={(e) => setField('TenDangNhap', e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>
                            Mật khẩu {editing && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(để trống nếu không đổi)</span>}
                        </label>
                        <input
                            type="password"
                            className="admin-input"
                            value={form.MatKhau}
                            onChange={(e) => setField('MatKhau', e.target.value)}
                            placeholder={editing ? '••••••' : 'Tối thiểu 6 ký tự'}
                            autoComplete="new-password"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
