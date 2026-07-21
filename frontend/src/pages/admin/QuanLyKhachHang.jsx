// src/pages/admin/QuanLyKhachHang.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import khachHangApi from '../../api/khachHangApi';
import Modal from '../../components/admin/Modal';
import AdminDateInput from '../../components/admin/AdminDateInput';

const EMPTY_FORM = {
    HoTen: '',
    SoDienThoai: '',
    NgaySinh: '',
    GioiTinh: '',
};

export default function QuanLyKhachHang() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [hangOptions, setHangOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [hang, setHang] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [page, setPage] = useState(1);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [editingInfo, setEditingInfo] = useState({ TongDiem: 0, NgayDangKy: '', TenHang: '' });
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        khachHangApi
            .getAll({ search, hang, trang_thai: trangThai, page, per_page: 10 })
            .then((res) => {
                if (res.data?.success) {
                    setList(res.data.data);
                    setPagination(res.data.pagination);
                }
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, hang, trangThai, page]);

    useEffect(() => {
        khachHangApi
            .getOptions()
            .then((res) => {
                if (res.data?.success) setHangOptions(res.data.data.hangThanhVien || []);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void loadList(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadList]);

    const openEdit = (kh) => {
        setEditing(kh.MaKhachHang);
        setEditingInfo({
            TongDiem: kh.TongDiem ?? 0,
            NgayDangKy: (kh.NgayDangKy || '').slice(0, 10),
            TenHang: kh.hangThanhVien?.TenHang || kh.MaHangThanhVien || '—',
        });
        setForm({
            HoTen: kh.HoTen ?? '',
            SoDienThoai: kh.SoDienThoai ?? '',
            NgaySinh: (kh.NgaySinh || '').slice(0, 10),
            GioiTinh: kh.GioiTinh ?? '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = {
            HoTen: form.HoTen,
            SoDienThoai: form.SoDienThoai,
            NgaySinh: form.NgaySinh || null,
            GioiTinh: form.GioiTinh || null,
        };
        try {
            await khachHangApi.update(editing, payload);
            setModalOpen(false);
            loadList();
            Swal.fire({ icon: 'success', title: 'Đã cập nhật khách hàng', timer: 1500, showConfirmButton: false });
        } catch (err) {
            const res = err.response?.data;
            const firstErr = res?.errors ? Object.values(res.errors)[0]?.[0] : null;
            setFormError(firstErr || res?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (kh) => {
        const dangHoatDong = kh.TrangThai === 'HoatDong';
        const confirm = await Swal.fire({
            title: `${dangHoatDong ? 'Khóa' : 'Mở khóa'} tài khoản ${kh.HoTen}?`,
            text: dangHoatDong
                ? 'Khách hàng sẽ không đăng nhập được cho tới khi mở lại.'
                : 'Khách hàng sẽ đăng nhập lại được bình thường.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Không',
            confirmButtonColor: dangHoatDong ? '#dc2626' : '#4f46e5',
        });
        if (!confirm.isConfirmed) return;
        try {
            await khachHangApi.toggleTrangThai(kh.MaKhachHang);
            Swal.fire({
                icon: 'success',
                title: dangHoatDong ? 'Đã khóa tài khoản' : 'Đã mở khóa',
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
                    <span className="admin-hero-eyebrow">Khách hàng &amp; thành viên</span>
                    <h2 className="admin-hero-title">Quản lý khách hàng</h2>
                </div>
            </header>

            {/* Thanh công cụ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo tên, SĐT hoặc mã…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <select className="admin-select" value={hang} onChange={(e) => setHang(e.target.value)}>
                    <option value="">Tất cả hạng</option>
                    {hangOptions.map((h) => (
                        <option key={h.MaHangThanhVien} value={h.MaHangThanhVien}>
                            {h.TenHang}
                        </option>
                    ))}
                </select>
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
                            <th>Họ tên</th>
                            <th>SĐT</th>
                            <th>Hạng</th>
                            <th>Điểm</th>
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
                                <td colSpan={7} className="admin-state">Chưa có khách hàng nào.</td>
                            </tr>
                        ) : (
                            list.map((kh) => (
                                <tr key={kh.MaKhachHang}>
                                    <td className="admin-mono">{kh.MaKhachHang}</td>
                                    <td>{kh.HoTen}</td>
                                    <td className="admin-nowrap">{kh.SoDienThoai}</td>
                                    <td>{kh.hangThanhVien?.TenHang || kh.MaHangThanhVien}</td>
                                    <td>{Number(kh.TongDiem).toLocaleString('vi-VN')}</td>
                                    <td>
                                        <span
                                            className={`admin-badge ${kh.TrangThai === 'HoatDong' ? 'admin-badge--on' : 'admin-badge--off'}`}
                                        >
                                            {kh.TrangThai === 'HoatDong' ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                                onClick={() => openEdit(kh)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className={`admin-btn admin-btn--sm ${kh.TrangThai === 'HoatDong' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                                                onClick={() => handleToggle(kh)}
                                            >
                                                {kh.TrangThai === 'HoatDong' ? 'Khóa' : 'Mở'}
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
                        Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} khách
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

            {/* Modal sửa */}
            <Modal
                open={modalOpen}
                title={`Sửa khách hàng ${editing || ''}`}
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

                {/* Thông tin chỉ đọc */}
                <div
                    style={{
                        display: 'flex',
                        gap: 20,
                        padding: '10px 14px',
                        marginBottom: 16,
                        background: '#f5f6fb',
                        borderRadius: 10,
                        fontSize: 13,
                    }}
                >
                    <div>
                        <div style={{ color: '#64748b' }}>Điểm tích lũy</div>
                        <div style={{ fontWeight: 700 }}>
                            {Number(editingInfo.TongDiem).toLocaleString('vi-VN')}
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#64748b' }}>Ngày đăng ký</div>
                        <div style={{ fontWeight: 600 }}>{editingInfo.NgayDangKy || '—'}</div>
                    </div>
                    <div>
                        <div style={{ color: '#64748b' }}>
                            Hạng thành viên{' '}
                            <span title="Hạng thành viên được hệ thống tự động nâng theo điểm/chi tiêu, không thể chỉnh sửa thủ công.">
                                ⓘ
                            </span>
                        </div>
                        <div style={{ fontWeight: 700 }}>{editingInfo.TenHang}</div>
                    </div>
                </div>

                <div className="admin-form">
                    <div className="admin-field admin-field--full">
                        <label>Họ tên</label>
                        <input
                            className="admin-input"
                            value={form.HoTen}
                            onChange={(e) => setField('HoTen', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Số điện thoại</label>
                        <input
                            className="admin-input"
                            value={form.SoDienThoai}
                            onChange={(e) => setField('SoDienThoai', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Ngày sinh</label>
                        <AdminDateInput
                            value={form.NgaySinh}
                            onChange={(v) => setField('NgaySinh', v)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Giới tính</label>
                        <select
                            className="admin-select"
                            value={form.GioiTinh}
                            onChange={(e) => setField('GioiTinh', e.target.value)}
                        >
                            <option value="">—</option>
                            <option value="Nam">Nam</option>
                            <option value="Nu">Nữ</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
