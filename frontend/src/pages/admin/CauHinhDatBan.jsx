// src/pages/admin/CauHinhDatBan.jsx
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import cauHinhDatBanApi from '../../api/cauHinhDatBanApi';

const EMPTY = {
    ThoiGianGiuChoPhut: 10,
    SoPhutDatToiThieu: 120,
    ThoiLuongPhucVuPhut: 120,
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

    // Đơn vị hiển thị/nhập cho "Đặt trước tối thiểu" — chỉ phục vụ UI, giá
    // trị lưu thật (form.SoPhutDatToiThieu) luôn quy về phút.
    const [leadUnit, setLeadUnit] = useState('gio');
    const [leadValue, setLeadValue] = useState(2);

    useEffect(() => {
        cauHinhDatBanApi
            .get()
            .then((res) => {
                if (res.data?.success) {
                    const d = res.data.data;
                    const soPhutDatToiThieu = Number(d.SoPhutDatToiThieu) || 0;

                    if (soPhutDatToiThieu > 0 && soPhutDatToiThieu % 60 === 0) {
                        setLeadUnit('gio');
                        setLeadValue(soPhutDatToiThieu / 60);
                    } else {
                        setLeadUnit('phut');
                        setLeadValue(soPhutDatToiThieu);
                    }

                    setForm({
                        ThoiGianGiuChoPhut: Number(d.ThoiGianGiuChoPhut) || 0,
                        SoPhutDatToiThieu: soPhutDatToiThieu,
                        ThoiLuongPhucVuPhut: Number(d.ThoiLuongPhucVuPhut) || 0,
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

    const handleLeadValueChange = (raw) => {
        setLeadValue(raw);
        const so = Number(raw) || 0;
        const phut = leadUnit === 'gio' ? Math.round(so * 60) : Math.round(so);
        setField('SoPhutDatToiThieu', phut);
    };

    const handleLeadUnitChange = (unit) => {
        if (unit === leadUnit) return;
        const soHienTai = Number(leadValue) || 0;
        const phutHienTai = leadUnit === 'gio' ? soHienTai * 60 : soHienTai;
        setLeadUnit(unit);
        setLeadValue(unit === 'gio' ? phutHienTai / 60 : Math.round(phutHienTai));
        setField('SoPhutDatToiThieu', Math.round(phutHienTai));
    };

    const handleSubmit = async () => {
        setFormError('');

        if (Number(form.SoPhutDatToiThieu) < Number(form.ThoiGianGiuChoPhut)) {
            setFormError(
                'Đặt trước tối thiểu phải lớn hơn hoặc bằng thời gian giữ chỗ chờ cọc, '
                + 'nếu không hạn thanh toán cọc sẽ rơi vào sau giờ hẹn.',
            );
            return;
        }

        setSaving(true);
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
                            <label>Đặt trước tối thiểu</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="number"
                                    min="0"
                                    step={leadUnit === 'gio' ? '0.25' : '1'}
                                    className="admin-input"
                                    style={{ flex: 1 }}
                                    value={leadValue}
                                    onChange={(e) => handleLeadValueChange(e.target.value)}
                                />
                                <select
                                    className="admin-input"
                                    style={{ flex: '0 0 100px' }}
                                    value={leadUnit}
                                    onChange={(e) => handleLeadUnitChange(e.target.value)}
                                >
                                    <option value="phut">Phút</option>
                                    <option value="gio">Giờ</option>
                                </select>
                            </div>
                            <small style={{ color: '#94a3b8' }}>
                                Khách phải đặt trước ít nhất khoảng thời gian này so với giờ hẹn. Chọn đơn vị Phút
                                để rút ngắn khi vắng khách (VD: 15–30 phút), hoặc Giờ khi cần chuẩn bị kỹ hơn lúc
                                đông khách.
                            </small>
                            {Number(form.SoPhutDatToiThieu) < Number(form.ThoiGianGiuChoPhut) && (
                                <small style={{ color: '#dc2626', display: 'block', marginTop: 6, fontWeight: 700 }}>
                                    ⛔ Mức này thấp hơn "Thời gian giữ chỗ chờ cọc" ({form.ThoiGianGiuChoPhut} phút) —
                                    khách có thể được cấp hạn thanh toán cọc muộn hơn cả giờ hẹn. Hãy tăng mức này lên
                                    ít nhất {form.ThoiGianGiuChoPhut} phút trước khi lưu.
                                </small>
                            )}
                            {Number(form.SoPhutDatToiThieu) < Number(form.SoGioHuyMotPhan) * 60 && (
                                <small style={{ color: '#b45309', display: 'block', marginTop: 6 }}>
                                    ⚠️ Với mức này, lượt đặt sát mốc tối thiểu sẽ đặt trước ít giờ hơn mốc "Hủy
                                    hoàn một phần trước" ({form.SoGioHuyMotPhan} giờ) — hệ thống sẽ tự đánh dấu
                                    những lượt đó <strong>không được hoàn cọc khi hủy</strong> (khách sẽ thấy cảnh
                                    báo này ngay lúc đặt).
                                </small>
                            )}
                        </div>

                        <div className="admin-field">
                            <label>Thời lượng phục vụ mỗi lượt (phút)</label>
                            <input
                                type="number"
                                min="30"
                                max="480"
                                className="admin-input"
                                value={form.ThoiLuongPhucVuPhut}
                                onChange={(e) => setField('ThoiLuongPhucVuPhut', e.target.value)}
                            />
                            <small style={{ color: '#94a3b8' }}>
                                Mỗi lượt đặt bàn coi như chiếm 1 bàn trong khoảng thời gian này kể từ giờ hẹn —
                                dùng để tính số bàn còn trống tại một thời điểm cụ thể.
                            </small>
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
