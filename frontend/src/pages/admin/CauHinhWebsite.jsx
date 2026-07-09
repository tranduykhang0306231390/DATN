// src/pages/admin/CauHinhWebsite.jsx
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import webSettingApi from '../../api/webSettingApi';

const EMPTY = {
    TenWebsite: '',
    Logo: '',
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

    useEffect(() => {
        webSettingApi
            .get()
            .then((res) => {
                if (res.data?.success) {
                    const d = res.data.data;
                    setForm({
                        TenWebsite: d.TenWebsite ?? '',
                        Logo: d.Logo ?? '',
                        DiaChi: d.DiaChi ?? '',
                        EmailLienHe: d.EmailLienHe ?? '',
                        SoDienThoai: d.SoDienThoai ?? '',
                        NoiDungWebsite: d.NoiDungWebsite ?? '',
                    });
                }
            })
            .catch(() => setFormError('Không tải được cấu hình website.'))
            .finally(() => setLoading(false));
    }, []);

    const setField = (key, value) => {
        setForm((f) => ({ ...f, [key]: value }));
        if (key === 'Logo') setLogoLoi(false);
    };

    const handleSubmit = async () => {
        if (!form.TenWebsite.trim()) {
            setFormError('Vui lòng nhập tên website.');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            await webSettingApi.update(form);
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
                    <p className="admin-hero-sub">
                        Tên, logo và thông tin liên hệ hiển thị trên trang khách hàng.
                    </p>
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
                                placeholder="VD: Buffet VIP"
                            />
                        </div>

                        <div className="admin-field admin-field--full">
                            <label>
                                Logo{' '}
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                    (đường dẫn ảnh)
                                </span>
                            </label>
                            <input
                                className="admin-input"
                                value={form.Logo}
                                onChange={(e) => setField('Logo', e.target.value)}
                                placeholder="https://... hoặc /images/logo.png"
                            />
                            {form.Logo && (
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
                                            Không tải được ảnh từ đường dẫn này.
                                        </span>
                                    ) : (
                                        <>
                                            <img
                                                src={form.Logo}
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