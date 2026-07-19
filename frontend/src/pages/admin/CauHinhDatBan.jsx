// src/pages/admin/CauHinhDatBan.jsx
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import cauHinhDatBanApi from '../../api/cauHinhDatBanApi';

const EMPTY = {
    ThoiGianGiuChoPhut: 10,
    SoGioDatToiThieu: 2,
    SoKhachToiThieu: 2,
    SoKhachToiDa: 20,
    PhutGiuBanSauGioHen: 15,
    MucCocMoiKhach: 50000,
    SoGioHuyMienPhi: 6,
    SoGioHuyMotPhan: 2,
    PhanTramHoanMotPhan: 50,
};

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function CauHinhDatBan() {
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        cauHinhDatBanApi
            .get()
            .then((res) => {
                if (res.data?.success) {
                    const d = res.data.data;
                    setForm({
                        ThoiGianGiuChoPhut: Number(d.ThoiGianGiuChoPhut) || 0,
                        SoGioDatToiThieu: Number(d.SoGioDatToiThieu) || 0,
                        SoKhachToiThieu: Number(d.SoKhachToiThieu) || 0,
                        SoKhachToiDa: Number(d.SoKhachToiDa) || 0,
                        PhutGiuBanSauGioHen: Number(d.PhutGiuBanSauGioHen) || 0,
                        MucCocMoiKhach: Number(d.MucCocMoiKhach) || 0,
                        SoGioHuyMienPhi: Number(d.SoGioHuyMienPhi) || 0,
                        SoGioHuyMotPhan: Number(d.SoGioHuyMotPhan) || 0,
                        PhanTramHoanMotPhan: Number(d.PhanTramHoanMotPhan) || 0,
                    });
                }
            })
            .catch(() => setFormError('Không tải được cấu hình đặt bàn.'))
            .finally(() => setLoading(false));
    }, []);

    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        setFormError('');
        const payload = Object.fromEntries(
            Object.entries(form).map(([k, v]) => [k, Number(v)]),
        );
        try {
            await cauHinhDatBanApi.update(payload);
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
                    <span className="admin-hero-eyebrow">Vận hành</span>
                    <h2 className="admin-hero-title">Cấu hình đặt bàn</h2>
                </div>
            </header>

            {loading ? (
                <div className="admin-table-wrap">
                    <div className="admin-state">Đang tải…</div>
                </div>
            ) : (
                <div className="admin-table-wrap" style={{ padding: '24px 26px', maxWidth: 760 }}>
                    {formError && <div className="admin-form-error">{formError}</div>}

                    <div className="admin-form">
                        <div className="admin-field admin-field--full">
                            <label>Mức cọc mỗi khách (đ)</label>
                            <input
                                type="number"
                                min="0"
                                className="admin-input"
                                value={form.MucCocMoiKhach}
                                onChange={(e) => setField('MucCocMoiKhach', e.target.value)}
                            />
                            <small style={{ color: '#94a3b8' }}>
                                VD: {fmtMoney(form.MucCocMoiKhach)}/khách
                            </small>
                        </div>

                        <div className="admin-field">
                            <label>Thời gian giữ chỗ chờ cọc (phút)</label>
                            <input
                                type="number"
                                min="1"
                                className="admin-input"
                                value={form.ThoiGianGiuChoPhut}
                                onChange={(e) => setField('ThoiGianGiuChoPhut', e.target.value)}
                            />
                        </div>

                        <div className="admin-field">
                            <label>Giữ bàn sau giờ hẹn (phút)</label>
                            <input
                                type="number"
                                min="1"
                                className="admin-input"
                                value={form.PhutGiuBanSauGioHen}
                                onChange={(e) => setField('PhutGiuBanSauGioHen', e.target.value)}
                            />
                            <small style={{ color: '#94a3b8' }}>
                                Quá mốc này mà khách chưa đến sẽ tự động chuyển "Không đến".
                            </small>
                        </div>

                        <div className="admin-field">
                            <label>Đặt trước tối thiểu (giờ)</label>
                            <input
                                type="number"
                                min="0"
                                className="admin-input"
                                value={form.SoGioDatToiThieu}
                                onChange={(e) => setField('SoGioDatToiThieu', e.target.value)}
                            />
                        </div>

                        <div className="admin-field">
                            <label>Số khách tối thiểu / lượt</label>
                            <input
                                type="number"
                                min="1"
                                className="admin-input"
                                value={form.SoKhachToiThieu}
                                onChange={(e) => setField('SoKhachToiThieu', e.target.value)}
                            />
                        </div>

                        <div className="admin-field">
                            <label>Số khách tối đa / lượt</label>
                            <input
                                type="number"
                                min="1"
                                className="admin-input"
                                value={form.SoKhachToiDa}
                                onChange={(e) => setField('SoKhachToiDa', e.target.value)}
                            />
                        </div>

                        <div className="admin-field">
                            <label>Hủy miễn phí trước (giờ)</label>
                            <input
                                type="number"
                                min="0"
                                className="admin-input"
                                value={form.SoGioHuyMienPhi}
                                onChange={(e) => setField('SoGioHuyMienPhi', e.target.value)}
                            />
                            <small style={{ color: '#94a3b8' }}>Hoàn 100% cọc</small>
                        </div>

                        <div className="admin-field">
                            <label>Hủy hoàn một phần trước (giờ)</label>
                            <input
                                type="number"
                                min="0"
                                className="admin-input"
                                value={form.SoGioHuyMotPhan}
                                onChange={(e) => setField('SoGioHuyMotPhan', e.target.value)}
                            />
                        </div>

                        <div className="admin-field admin-field--full">
                            <label>Phần trăm hoàn khi hủy một phần (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="admin-input"
                                value={form.PhanTramHoanMotPhan}
                                onChange={(e) => setField('PhanTramHoanMotPhan', e.target.value)}
                            />
                            <small style={{ color: '#94a3b8' }}>
                                Áp dụng khi khách hủy trong khoảng từ "{form.SoGioHuyMotPhan} giờ" đến "
                                {form.SoGioHuyMienPhi} giờ" trước giờ đặt. Hủy sát giờ hơn hoặc không đến sẽ mất 100% cọc.
                            </small>
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
