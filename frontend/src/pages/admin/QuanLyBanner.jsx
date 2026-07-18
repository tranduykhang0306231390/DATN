// src/pages/admin/QuanLyBanner.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import bannerApi from '../../api/bannerApi';
import Modal from '../../components/admin/Modal';
import { getBackendAssetUrl } from '../../utils/apiUrl';

const EMPTY_FORM = { TieuDe: '', Link: '', ThuTu: 1 };

const anhSrc = (b) => b.Link || getBackendAssetUrl(`banner/${b.HinhAnh}`);

export default function QuanLyBanner() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [anhLoi, setAnhLoi] = useState(false);

    // Ảnh chọn từ máy (chưa lưu) + ảnh hiện có khi sửa (nếu không chọn ảnh mới)
    const [imageFile, setImageFile] = useState(null);
    const [existingHinhAnh, setExistingHinhAnh] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl('');
            return undefined;
        }

        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    const loadList = useCallback(() => {
        setLoading(true);
        bannerApi
            .getAll()
            .then((res) => {
                if (res.data?.success) setList(res.data.data);
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadList(); }, [loadList]);

    const openCreate = () => {
        setEditing(null);
        setForm({ ...EMPTY_FORM, ThuTu: list.length + 1 });
        setImageFile(null);
        setExistingHinhAnh('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setFormError(''); setAnhLoi(''); setModalOpen(true);
    };

    const openEdit = (b) => {
        setEditing(b.MaBanner);
        setForm({
            TieuDe: b.TieuDe ?? '',
            Link: b.Link ?? '',
            ThuTu: Number(b.ThuTu) || 1,
        });
        setImageFile(null);
        setExistingHinhAnh(b.HinhAnh ?? '');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setFormError(''); setAnhLoi(false); setModalOpen(true);
    };

    const setField = (key, value) => {
        setForm((f) => ({ ...f, [key]: value }));
        if (key === 'Link') setAnhLoi(false);
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files?.[0] || null);
        setAnhLoi(false);
    };

    const handleSubmit = async () => {
        if (!imageFile && !form.Link.trim() && !existingHinhAnh) {
            setFormError('Vui lòng chọn ảnh từ máy hoặc nhập đường dẫn ảnh.');
            return;
        }
        if (!form.TieuDe.trim()) {
            setFormError('Vui lòng nhập tiêu đề banner.');
            return;
        }
        setSaving(true); setFormError('');

        const formData = new FormData();
        formData.append('TieuDe', form.TieuDe);
        formData.append('Link', form.Link || '');
        formData.append('ThuTu', String(Number(form.ThuTu)));
        if (imageFile) formData.append('HinhAnh', imageFile);

        try {
            if (editing) await bannerApi.update(editing, formData);
            else await bannerApi.create(formData);
            setModalOpen(false);
            loadList();
            Swal.fire({
                icon: 'success',
                title: editing ? 'Đã cập nhật banner' : 'Đã thêm banner',
                timer: 1500, showConfirmButton: false,
            });
        } catch (err) {
            const res = err.response?.data;
            const firstErr = res?.errors ? Object.values(res.errors)[0]?.[0] : null;
            setFormError(firstErr || res?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (b) => {
        const dangHien = Number(b.TrangThai) === 1;
        const confirm = await Swal.fire({
            title: `${dangHien ? 'Ẩn' : 'Hiện'} banner ${b.MaBanner}?`,
            text: dangHien ? 'Banner sẽ không hiển thị trên trang chủ.' : 'Banner sẽ hiển thị lại.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Không',
            confirmButtonColor: dangHien ? '#dc2626' : '#4f46e5',
        });
        if (!confirm.isConfirmed) return;
        try {
            await bannerApi.toggle(b.MaBanner);
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể đổi trạng thái', 'error');
        }
    };

    const handleDelete = async (b) => {
        const confirm = await Swal.fire({
            title: `Xóa banner ${b.MaBanner}?`,
            text: 'Thao tác này không thể hoàn tác.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Không',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;
        try {
            await bannerApi.remove(b.MaBanner);
            Swal.fire({ icon: 'success', title: 'Đã xóa banner', timer: 1500, showConfirmButton: false });
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể xóa banner', 'error');
        }
    };

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Hệ thống</span>
                    <h2 className="admin-hero-title">Quản lý banner</h2>
                    
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openCreate}>
                        + Thêm banner
                    </button>
                </div>
            </header>

            <div className="admin-table-wrap" style={{ marginTop: 22 }}>
                <table className="admin-table" style={{ minWidth: 760 }}>
                    <thead>
                        <tr>
                            <th>Thứ tự</th>
                            <th>Ảnh</th>
                            <th>Mã</th>
                            <th>Tiêu đề</th>
                            <th>Trạng thái</th>
                            <th className="admin-th-action">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="admin-state">Đang tải…</td></tr>
                        ) : list.length === 0 ? (
                            <tr><td colSpan={6} className="admin-state">Chưa có banner nào.</td></tr>
                        ) : (
                            list.map((b) => (
                                <tr key={b.MaBanner}>
                                    <td style={{ fontWeight: 700, fontSize: 16 }}>{b.ThuTu}</td>
                                    <td>
                                        <img
                                            src={anhSrc(b)}
                                            alt={b.TieuDe || b.MaBanner}
                                            style={{
                                                width: 130, height: 70, objectFit: 'cover',
                                                borderRadius: 8, background: '#eef0f6',
                                            }}
                                            onError={(e) => { e.currentTarget.style.opacity = 0.25; }}
                                        />
                                    </td>
                                    <td className="admin-mono">{b.MaBanner}</td>
                                    <td style={{ fontWeight: 600 }}>{b.TieuDe || '—'}</td>
                                    <td>
                                        <span className={`admin-badge ${Number(b.TrangThai) === 1 ? 'admin-badge--on' : 'admin-badge--off'}`}>
                                            {Number(b.TrangThai) === 1 ? 'Đang hiện' : 'Đã ẩn'}
                                        </span>
                                    </td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => openEdit(b)}>Sửa</button>
                                            <button
                                                type="button"
                                                className={`admin-btn admin-btn--sm ${Number(b.TrangThai) === 1 ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                                                onClick={() => handleToggle(b)}
                                            >
                                                {Number(b.TrangThai) === 1 ? 'Ẩn' : 'Hiện'}
                                            </button>
                                            <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleDelete(b)}>Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                open={modalOpen}
                title={editing ? `Sửa banner ${editing}` : 'Thêm banner mới'}
                onClose={() => setModalOpen(false)}
                width={560}
                footer={
                    <>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setModalOpen(false)} disabled={saving}>Hủy</button>
                        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Đang lưu…' : 'Lưu'}
                        </button>
                    </>
                }
            >
                {formError && <div className="admin-form-error">{formError}</div>}

                <div className="admin-form">
                    <div className="admin-field admin-field--full">
                        <label>Ảnh banner</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="admin-input"
                            onChange={handleFileChange}
                        />
                        {editing && !imageFile && existingHinhAnh && (
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                                Đang dùng ảnh hiện tại ({existingHinhAnh}). Chọn ảnh mới nếu muốn thay đổi.
                            </span>
                        )}
                    </div>

                    <div className="admin-field">
                        <label>Thứ tự</label>
                        <input
                            type="number" min="1" className="admin-input"
                            value={form.ThuTu}
                            onChange={(e) => setField('ThuTu', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>
                            Hoặc dán URL ảnh{' '}
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}>(tùy chọn)</span>
                        </label>
                        <input
                            className="admin-input"
                            value={form.Link}
                            onChange={(e) => setField('Link', e.target.value)}
                            placeholder="https://... (bỏ qua nếu đã chọn ảnh từ máy)"
                        />
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>
                            Tiêu đề{' '}
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}>(bắt buộc)</span>
                        </label>
                        <input
                            className="admin-input"
                            value={form.TieuDe}
                            onChange={(e) => setField('TieuDe', e.target.value)}
                            placeholder="VD: Buffet Hải Sản"
                        />
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            Dòng chữ hiển thị đè lên ảnh ở trang chủ.
                        </span>
                    </div>

                    {(previewUrl || form.Link || existingHinhAnh) && (
                        <div className="admin-field admin-field--full">
                            <div style={{ padding: 10, background: '#f5f6fb', borderRadius: 10 }}>
                                {anhLoi ? (
                                    <span style={{ fontSize: 13, color: '#dc2626' }}>
                                        Không tải được ảnh xem trước.
                                    </span>
                                ) : (
                                    <img
                                        src={
                                            previewUrl
                                            || form.Link
                                            || getBackendAssetUrl(`banner/${existingHinhAnh}`)
                                        }
                                        alt="Xem trước"
                                        onError={() => setAnhLoi(true)}
                                        style={{ width: '100%', maxHeight: 170, objectFit: 'cover', borderRadius: 8 }}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}