// src/pages/staff/TaoHoaDon.jsx
import { useState, useEffect, useCallback } from 'react';
import hoaDonApi from '../../api/hoaDonApi';
import '../../assets/css/staff.css';
import {
    fmt, BUOI_LABEL, NGAY_LABEL, NHOM_LABEL,
    PageTitle, SumRow, LoadingBox,
} from '../../components/staff/StaffComponents';

export default function TaoHoaDon() {
    const [loaiVeList, setLoaiVeList] = useState([]);
    const [cart,       setCart]       = useState({});
    const [sdtInput,   setSdtInput]   = useState('');
    const [khachHang,  setKhachHang]  = useState(null);
    const [vouchers,   setVouchers]   = useState([]);
    const [selected,   setSelected]   = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [sdtLoading, setSdtLoading] = useState(false);
    const [result,     setResult]     = useState(null);
    const [error,      setError]      = useState('');
    const [sdtError,   setSdtError]   = useState('');

    useEffect(() => {
        hoaDonApi.getLoaiVe()
            .then((res) => setLoaiVeList(res.data.data))
            .catch(() => setError('Không tải được danh sách vé.'));
    }, []);

    // ── Giỏ vé ───────────────────────────────────────────────────────────────
    const setQty = (maVe, delta) => {
        setCart((prev) => {
            const cur = (prev[maVe] || 0) + delta;
            if (cur <= 0) { const next = { ...prev }; delete next[maVe]; return next; }
            return { ...prev, [maVe]: cur };
        });
    };

    const cartItems = loaiVeList
        .filter((v) => cart[v.MaLoaiVe])
        .map((v) => ({ ...v, SoLuong: cart[v.MaLoaiVe], ThanhTien: v.GiaVe * cart[v.MaLoaiVe] }));

    const tongTienGoc = cartItems.reduce((s, i) => s + i.ThanhTien, 0);

    // ── Tính giảm preview ────────────────────────────────────────────────────
    const tinhGiam = useCallback(() => {
        let giam = 0;
        const nhomDung = {};
        const sorted = [...vouchers]
            .filter((v) => selected.includes(v.MaVoucherKhachHang))
            .sort((a, b) => a.ThuTuApDung - b.ThuTuApDung);
        for (const v of sorted) {
            if (nhomDung[v.NhomUuDai] && !v.CoTheDungChung) continue;
            giam += v.NhomUuDai === 'PhanTram'
                ? tongTienGoc * (v.GiaTriGiam / 100)
                : v.GiaTriGiam;
            nhomDung[v.NhomUuDai] = true;
        }
        return Math.min(giam, tongTienGoc);
    }, [selected, vouchers, tongTienGoc]);

    const tongGiam      = tinhGiam();
    const tongThanhToan = tongTienGoc - tongGiam;

    // ── Tra cứu KH ───────────────────────────────────────────────────────────
    const handleLookup = async () => {
        setSdtError(''); setKhachHang(null); setVouchers([]); setSelected([]);
        if (!sdtInput.trim()) return;
        setSdtLoading(true);
        try {
            const res = await hoaDonApi.lookupKhachHang(sdtInput.trim());
            if (res.data.success) {
                setKhachHang(res.data.khachHang);
                setVouchers(res.data.vouchers);
            }
        } catch (e) {
            setSdtError(e.response?.data?.message || 'Không tìm thấy khách hàng.');
        } finally {
            setSdtLoading(false);
        }
    };

    const handleClearKH = () => {
        setSdtInput(''); setKhachHang(null);
        setVouchers([]); setSelected([]); setSdtError('');
    };

    const toggleVoucher = (maVKH) => {
        setSelected((prev) =>
            prev.includes(maVKH) ? prev.filter((x) => x !== maVKH) : [...prev, maVKH]
        );
    };

    // ── Tạo hóa đơn ──────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (cartItems.length === 0) { setError('Vui lòng chọn ít nhất 1 vé.'); return; }
        setError(''); setLoading(true);
        try {
            const res = await hoaDonApi.taoHoaDon({
                chi_tiet:         cartItems.map((i) => ({ MaLoaiVe: i.MaLoaiVe, SoLuong: i.SoLuong })),
                ma_khach_hang:    khachHang?.MaKhachHang || null,
                vouchers_ap_dung: selected,
            });
            if (res.data.success) {
                setResult(res.data.data);
                setCart({}); setKhachHang(null); setVouchers([]);
                setSelected([]); setSdtInput('');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn.');
        } finally {
            setLoading(false);
        }
    };

    if (result) return <HoaDonResult result={result} onNew={() => setResult(null)} />;

    const grouped = loaiVeList.reduce((acc, v) => {
        if (!acc[v.BuoiAn]) acc[v.BuoiAn] = [];
        acc[v.BuoiAn].push(v);
        return acc;
    }, {});

    return (
        <div className="staff-page">
            <PageTitle>🧾 Tạo hóa đơn tại quầy</PageTitle>

            <div className="tao-hd-layout">
                {/* ── CỘT TRÁI ─────────────────────────────────────────── */}
                <div className="tao-hd-left">

                    {/* Chọn vé */}
                    <div className="staff-card">
                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Chọn vé</h3>
                        {Object.entries(grouped).map(([buoi, list]) => (
                            <div key={buoi} style={{ marginBottom: 20 }}>
                                <div className="buoi-label">{BUOI_LABEL[buoi] || buoi}</div>
                                {list.map((ve) => (
                                    <div key={ve.MaLoaiVe} className="ve-row">
                                        <div style={{ flex: 1 }}>
                                            <div className="ve-name">{ve.TenLoaiVe}</div>
                                            <div className="ve-meta">
                                                {NGAY_LABEL[ve.LoaiNgay] || ve.LoaiNgay} · {fmt(ve.GiaVe)}/vé
                                            </div>
                                        </div>
                                        <div className="qty-control">
                                            <button className="qty-btn" onClick={() => setQty(ve.MaLoaiVe, -1)}>−</button>
                                            <span className="qty-num">{cart[ve.MaLoaiVe] || 0}</span>
                                            <button className="qty-btn" onClick={() => setQty(ve.MaLoaiVe, +1)}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Thành viên */}
                    <div className="staff-card">
                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Thành viên (tùy chọn)</h3>

                        {!khachHang ? (
                            <div className="sdt-row">
                                <input
                                    className="staff-input"
                                    placeholder="Nhập số điện thoại thành viên..."
                                    value={sdtInput}
                                    onChange={(e) => setSdtInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                />
                                <button
                                    className="btn-primary"
                                    style={{ minWidth: 90 }}
                                    onClick={handleLookup}
                                    disabled={sdtLoading}
                                >
                                    {sdtLoading ? '...' : 'Tra cứu'}
                                </button>
                            </div>
                        ) : (
                            <div className="kh-row">
                                <div className="kh-badge">{khachHang.TenHang}</div>
                                <div>
                                    <div className="kh-name">{khachHang.HoTen}</div>
                                    <div className="kh-sub">{khachHang.SoDienThoai} · {khachHang.TongDiem} điểm</div>
                                </div>
                                <button className="btn-ghost" onClick={handleClearKH}>✕ Xóa</button>
                            </div>
                        )}

                        {sdtError && <div className="alert-warn">{sdtError}</div>}

                        {/* Voucher */}
                        {vouchers.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <div className="voucher-title">Voucher có thể áp dụng</div>
                                {vouchers.map((v) => {
                                    const checked = selected.includes(v.MaVoucherKhachHang);
                                    return (
                                        <label
                                            key={v.MaVoucherKhachHang}
                                            className="voucher-item"
                                            style={{
                                                borderColor: checked ? '#16a34a' : '#e5e7eb',
                                                background:  checked ? '#f0fdf4' : '#fff',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleVoucher(v.MaVoucherKhachHang)}
                                                style={{ marginRight: 10, accentColor: '#16a34a' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div className="voucher-name">{v.TenUuDai}</div>
                                                <div className="voucher-sub">
                                                    {NHOM_LABEL[v.NhomUuDai] || v.NhomUuDai}
                                                    {v.NhomUuDai === 'PhanTram'
                                                        ? ` · Giảm ${v.GiaTriGiam}%`
                                                        : ` · ${fmt(v.GiaTriGiam)}`}
                                                    {' · HSD: '}{v.NgayHetHan}
                                                </div>
                                            </div>
                                            {checked && <span className="voucher-check">✓</span>}
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {khachHang && vouchers.length === 0 && (
                            <div className="alert-info">Khách hàng không có voucher nào khả dụng.</div>
                        )}
                    </div>
                </div>

                {/* ── CỘT PHẢI ────────────────────────────────────────── */}
                <div className="tao-hd-right">
                    <div className="staff-card" style={{ position: 'sticky', top: 16 }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Tóm tắt hóa đơn</h3>

                        {cartItems.length === 0 ? (
                            <div className="empty-cart">Chưa chọn vé nào</div>
                        ) : (
                            <>
                                {cartItems.map((i) => (
                                    <div key={i.MaLoaiVe} className="summary-row">
                                        <span style={{ flex: 1 }}>{i.TenLoaiVe} × {i.SoLuong}</span>
                                        <span>{fmt(i.ThanhTien)}</span>
                                    </div>
                                ))}
                                <div className="divider" />
                                <div className="summary-row">
                                    <span>Tạm tính</span>
                                    <span>{fmt(tongTienGoc)}</span>
                                </div>
                                {tongGiam > 0 && (
                                    <div className="summary-row" style={{ color: '#16a34a' }}>
                                        <span>Giảm giá</span>
                                        <span>−{fmt(tongGiam)}</span>
                                    </div>
                                )}
                                <div className="divider" />
                                <div className="summary-row" style={{ fontWeight: 700, fontSize: 18 }}>
                                    <span>Tổng thanh toán</span>
                                    <span style={{ color: '#b45309' }}>{fmt(tongThanhToan)}</span>
                                </div>
                                {khachHang && (
                                    <div className="diem-note">
                                        🌟 Điểm tích lũy dự kiến:{' '}
                                        <strong>+{Math.floor(tongThanhToan / 10000)} điểm</strong>
                                    </div>
                                )}
                            </>
                        )}

                        {error && <div className="alert-danger">{error}</div>}

                        <button
                            className="btn-success"
                            onClick={handleSubmit}
                            disabled={cartItems.length === 0 || loading}
                        >
                            {loading ? 'Đang xử lý...' : '✅ Tạo hóa đơn'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Màn hình kết quả ────────────────────────────────────────────────────────
function HoaDonResult({ result, onNew }) {
    return (
        <div className="staff-page" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="staff-card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
                <h2 style={{ margin: '0 0 4px', color: '#15803d' }}>Hóa đơn tạo thành công!</h2>
                <div style={{ color: '#6b7280', marginBottom: 24 }}>
                    Mã hóa đơn: <strong>{result.MaHoaDon}</strong>
                </div>
                <div className="result-grid">
                    <ResultRow label="Tổng tiền gốc" value={fmt(result.TongTienGoc)} />
                    <ResultRow label="Giảm giá"      value={`−${fmt(result.TongGiam)}`}       color="#16a34a" />
                    <ResultRow label="Thanh toán"    value={fmt(result.TongThanhToan)}         bold accent />
                    {result.DiemTichLuy > 0 && (
                        <ResultRow label="Điểm tích lũy" value={`+${result.DiemTichLuy} điểm`} color="#d97706" />
                    )}
                </div>
                <button className="btn-success" onClick={onNew}>+ Tạo hóa đơn mới</button>
            </div>
        </div>
    );
}

function ResultRow({ label, value, color, bold, accent }) {
    return (
        <div className="result-row">
            <span style={{ color: '#6b7280' }}>{label}</span>
            <span style={{
                color:      accent ? '#b45309' : (color || '#111827'),
                fontWeight: bold   ? 700       : 400,
                fontSize:   accent ? 18        : 15,
            }}>{value}</span>
        </div>
    );
}