// src/pages/admin/CauHinhWebsite.jsx
import { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import webSettingApi from '../../api/webSettingApi';
import { getBackendAssetUrl } from '../../utils/apiUrl';

const EMPTY = {
    TenWebsite: '',
    DiaChi: '',
    EmailLienHe: '',
    SoDienThoai: '',
    NoiDungWebsite: '',
};

export default function CauHinhWebsite() {
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [logoLoi, setLogoLoi] = useState(false);

    // Logo hiện có trên server + logo mới chọn từ máy (chưa lưu)
    const [existingLogo, setExistingLogo] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        webSettingApi
            .getAdmin()
            .then((res) => {
                if (res.data?.success) {
                    const d = res.data.data;
                    setForm({
                        TenWebsite: d.TenWebsite ?? '',
                        DiaChi: d.DiaChi ?? '',
                        EmailLienHe: d.EmailLienHe ?? '',
                        SoDienThoai: d.SoDienThoai ?? '',
                        NoiDungWebsite: d.NoiDungWebsite ?? '',
                    });
                    setExistingLogo(d.Logo ?? '');
                }
            })
            .catch(() => setFormError('Không tải được cấu hình website.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!logoFile) {
            setPreviewUrl('');
            return undefined;
        }

        const url = URL.createObjectURL(logoFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [logoFile]);

    const setField = (key, value) => {
        setForm((f) => ({ ...f, [key]: value }));
    };

    const handleLogoChange = (e) => {
        setLogoFile(e.target.files?.[0] || null);
        setLogoLoi(false);
    };

    const handleSubmit = async () => {
        if (!form.TenWebsite.trim()) {
            setFormError('Vui lòng nhập tên website.');
            return;
        }
        setSaving(true);
        setFormError('');

        const formData = new FormData();
        formData.append('TenWebsite', form.TenWebsite);
        formData.append('DiaChi', form.DiaChi || '');
        formData.append('EmailLienHe', form.EmailLienHe || '');
        formData.append('SoDienThoai', form.SoDienThoai || '');
        formData.append('NoiDungWebsite', form.NoiDungWebsite || '');
        if (logoFile) formData.append('Logo', logoFile);

        try {
            const res = await webSettingApi.update(formData);
            if (res.data?.data?.Logo !== undefined) {
                setExistingLogo(res.data.data.Logo ?? '');
            }
            setLogoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            Swal.fire({
                icon: 'success',
                title: 'Đã lưu cấu hình',
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

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Hệ thống</span>
                    <h2 className="admin-hero-title">Cấu hình website</h2>
                </div>
            </header>

            {loading ? (
                <div className="admin-table-wrap">
                    <div className="admin-state">Đang tải…</div>
                </div>
            ) : (
                <div
                    className="admin-table-wrap"
                    style={{ padding: '24px 26px', maxWidth: 760 }}
                >
                    {formError && <div className="admin-form-error">{formError}</div>}

                    <div className="admin-form">
                        <div className="admin-field admin-field--full">
                            <label>Tên website</label>
                            <input
                                className="admin-input"
                                value={form.TenWebsite}
                                onChange={(e) => setField('TenWebsite', e.target.value)}
                                placeholder="VD: Buffet"
                            />
                        </div>

                        <div className="admin-field admin-field--full">
                            <label>Logo</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="admin-input"
                                onChange={handleLogoChange}
                            />
                            {!logoFile && existingLogo && (
                                <span style={{ fontSize: 12, color: '#64748b' }}>
                                    Đang dùng logo hiện tại. Chọn ảnh mới nếu muốn thay đổi.
                                </span>
                            )}
                            {(previewUrl || existingLogo) && (
                                <div
                                    style={{
                                        marginTop: 10,
                                        padding: 12,
                                        background: '#f5f6fb',
                                        borderRadius: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    {logoLoi ? (
                                        <span style={{ fontSize: 13, color: '#dc2626' }}>
                                            Không tải được ảnh xem trước.
                                        </span>
                                    ) : (
                                        <>
                                            <img
                                                src={previewUrl || getBackendAssetUrl(`logo/${existingLogo}`)}
                                                alt="Logo"
                                                onError={() => setLogoLoi(true)}
                                                style={{
                                                    height: 48,
                                                    maxWidth: 160,
                                                    objectFit: 'contain',
                                                }}
                                            />
                                            <span style={{ fontSize: 12, color: '#64748b' }}>
                                                Xem trước
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="admin-field">
                            <label>Email liên hệ</label>
                            <input
                                type="email"
                                className="admin-input"
                                value={form.EmailLienHe}
                                onChange={(e) => setField('EmailLienHe', e.target.value)}
                                placeholder="lienhe@buffetvip.vn"
                            />
                        </div>

                        <div className="admin-field">
                            <label>Số điện thoại</label>
                            <input
                                className="admin-input"
                                value={form.SoDienThoai}
                                onChange={(e) => setField('SoDienThoai', e.target.value)}
                                placeholder="0901234567"
                            />
                        </div>

                        <div className="admin-field admin-field--full">
                            <label>Địa chỉ</label>
                            <input
                                className="admin-input"
                                value={form.DiaChi}
                                onChange={(e) => setField('DiaChi', e.target.value)}
                                placeholder="Số nhà, đường, quận, thành phố"
                            />
                        </div>

                        <div className="admin-field admin-field--full">
                            <label>Nội dung giới thiệu</label>
                            <textarea
                                className="admin-input"
                                rows={6}
                                value={form.NoiDungWebsite}
                                onChange={(e) => setField('NoiDungWebsite', e.target.value)}
                                placeholder="Giới thiệu về nhà hàng, hiển thị ở trang chủ…"
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: 20,
                            paddingTop: 18,
                            borderTop: '1px solid #e6e9f2',
                        }}
                    >
                        <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}