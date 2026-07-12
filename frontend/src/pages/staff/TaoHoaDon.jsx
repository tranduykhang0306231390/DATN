// src/pages/staff/TaoHoaDon.jsx
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import hoaDonApi from '../../api/hoaDonApi';
import '../../assets/css/staff.css';
import {
    fmt, BUOI_LABEL, NGAY_LABEL, NHOM_LABEL,
    PageTitle,
} from '../../components/staff/StaffComponents';

const TONG_SO_BAN = 20;

export default function TaoHoaDon() {
    const [loaiVeList, setLoaiVeList] = useState([]);
    const [banTreo,    setBanTreo]    = useState([]);
    const [soBan,      setSoBan]      = useState(null);
    const [payBill,    setPayBill]    = useState(null);

    const [cart,       setCart]       = useState({});
    const [sdtInput,   setSdtInput]   = useState('');
    const [khachHang,  setKhachHang]  = useState(null);
    const [vouchers,   setVouchers]   = useState([]);
    const [selected,   setSelected]   = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [sdtLoading, setSdtLoading] = useState(false);
    const [error,      setError]      = useState('');
    const [sdtError,   setSdtError]   = useState('');

    const banTreoMap = banTreo.reduce((acc, hd) => {
        acc[String(hd.SoBan)] = hd;
        return acc;
    }, {});

    const loadBanTreo = useCallback(() => {
        hoaDonApi.banDangTreo()
            .then((res) => setBanTreo(res.data.data || []))
            .catch(() => setBanTreo([]));
    }, []);

    useEffect(() => {
        hoaDonApi.getLoaiVe()
            .then((res) => setLoaiVeList(res.data.data))
            .catch(() => setError('Không tải được danh sách vé.'));
        loadBanTreo();
    }, [loadBanTreo]);

    const resetForm = () => {
        setCart({}); setSdtInput(''); setKhachHang(null);
        setVouchers([]); setSelected([]); setError(''); setSdtError('');
    };

    const chonBan = (n) => {
        const hd = banTreoMap[String(n)];
        if (hd) { setPayBill(hd); setSoBan(null); }
        else { setSoBan(n); setPayBill(null); resetForm(); }
    };

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

    const tinhGiam = useCallback(() => {
        let giam = 0;
        const nhomDung = {};
        const sorted = [...vouchers]
            .filter((v) => selected.includes(v.MaVoucherKhachHang))
            .sort((a, b) => a.ThuTuApDung - b.ThuTuApDung);
        for (const v of sorted) {
            if (nhomDung[v.NhomUuDai] && !v.CoTheDungChung) continue;
            giam += v.NhomUuDai === 'PhanTram' ? tongTienGoc * (v.GiaTriGiam / 100) : v.GiaTriGiam;
            nhomDung[v.NhomUuDai] = true;
        }
        return Math.min(giam, tongTienGoc);
    }, [selected, vouchers, tongTienGoc]);

    const tongGiam      = tinhGiam();
    const tongThanhToan = tongTienGoc - tongGiam;

    const handleLookup = async () => {
        setSdtError(''); setKhachHang(null); setVouchers([]); setSelected([]);
        if (!sdtInput.trim()) return;
        setSdtLoading(true);
        try {
            const res = await hoaDonApi.lookupKhachHang(sdtInput.trim());
            if (res.data.success) { setKhachHang(res.data.khachHang); setVouchers(res.data.vouchers); }
        } catch (e) {
            setSdtError(e.response?.data?.message || 'Không tìm thấy khách hàng.');
        } finally { setSdtLoading(false); }
    };

    const handleClearKH = () => {
        setSdtInput(''); setKhachHang(null);
        setVouchers([]); setSelected([]); setSdtError('');
    };

    const toggleVoucher = (maVKH) => {
        setSelected((prev) => prev.includes(maVKH) ? prev.filter((x) => x !== maVKH) : [...prev, maVKH]);
    };

    const handleMoBan = async () => {
        if (!soBan) { setError('Vui lòng chọn bàn.'); return; }
        if (cartItems.length === 0) { setError('Vui lòng chọn ít nhất 1 vé.'); return; }
        setError(''); setLoading(true);
        try {
            const res = await hoaDonApi.taoHoaDon({
                so_ban:           soBan,
                chi_tiet:         cartItems.map((i) => ({ MaLoaiVe: i.MaLoaiVe, SoLuong: i.SoLuong })),
                ma_khach_hang:    khachHang?.MaKhachHang || null,
                vouchers_ap_dung: selected,
            });
            if (res.data.success) {
                Swal.fire({ icon: 'success', title: `Đã mở bàn ${soBan}`, timer: 1500, showConfirmButton: false });
                setSoBan(null); resetForm(); loadBanTreo();
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Có lỗi xảy ra khi mở bàn.');
        } finally { setLoading(false); }
    };

    const handleThanhToan = async () => {
        if (!payBill) return;
        const confirm = await Swal.fire({
            title: `Thanh toán bàn ${payBill.SoBan}?`,
            text: 'Hóa đơn sẽ được chốt và tích điểm cho khách (nếu có).',
            icon: 'question', showCancelButton: true,
            confirmButtonText: 'Thanh toán', cancelButtonText: 'Hủy',
            confirmButtonColor: '#16a34a',
        });
        if (!confirm.isConfirmed) return;
        setLoading(true);
        try {
            const res = await hoaDonApi.thanhToan(payBill.MaHoaDon);
            if (res.data.success) {
                const d = res.data.data;
                Swal.fire({
                    icon: 'success', title: 'Thanh toán thành công',
                    html: `Tổng: <b>${fmt(d.TongThanhToan)}</b>` +
                          (d.DiemTichLuy > 0 ? `<br>Điểm tích lũy: <b>+${d.DiemTichLuy}</b>` : ''),
                });
                setPayBill(null); loadBanTreo();
            }
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể thanh toán.', 'error');
        } finally { setLoading(false); }
    };

    const grouped = loaiVeList.reduce((acc, v) => {
        if (!acc[v.BuoiAn]) acc[v.BuoiAn] = [];
        acc[v.BuoiAn].push(v);
        return acc;
    }, {});

    return (
        <div className="staff-page">
            <PageTitle>🧾 Tạo hóa đơn tại quầy</PageTitle>

            <div className="staff-card" style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Chọn bàn</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 10 }}>
                    {Array.from({ length: TONG_SO_BAN }, (_, i) => i + 1).map((n) => {
                        const occupied = !!banTreoMap[String(n)];
                        const isSelected = soBan === n;
                        const isPaying   = payBill && Number(payBill.SoBan) === n;
                        return (
                            <button key={n} type="button" onClick={() => chonBan(n)}
                                style={{
                                    padding: '14px 8px', borderRadius: 10,
                                    border: (isSelected || isPaying) ? '2px solid #111827' : '1px solid transparent',
                                    cursor: 'pointer', fontWeight: 700, fontSize: 15,
                                    background: occupied ? '#fee2e2' : '#dcfce7',
                                    color: occupied ? '#b91c1c' : '#15803d',
                                }}>
                                Bàn {n}
                                <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                                    {occupied ? 'Đang ăn' : 'Trống'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {payBill && (
                <div className="staff-card" style={{ marginBottom: 20, borderLeft: '4px solid #dc2626' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Bàn {payBill.SoBan} · {payBill.MaHoaDon}</h3>
                        <button className="btn-ghost" onClick={() => setPayBill(null)}>✕ Đóng</button>
                    </div>
                    {payBill.khach_hang && (
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                            Khách: {payBill.khach_hang.HoTen} · {payBill.khach_hang.SoDienThoai}
                        </div>
                    )}
                    <table className="staff-table">
                        <thead><tr><th>Loại vé</th><th style={{ textAlign: 'center' }}>SL</th><th style={{ textAlign: 'right' }}>Thành tiền</th></tr></thead>
                        <tbody>
                            {(payBill.chi_tiet_hoa_don || []).map((ct) => (
                                <tr key={ct.MaChiTietHD}>
                                    <td>{ct.loai_ve?.TenLoaiVe || ct.MaLoaiVe}</td>
                                    <td style={{ textAlign: 'center' }}>{ct.SoLuong}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(ct.DonGia * ct.SoLuong)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0', fontWeight: 700, fontSize: 17 }}>
                        <span>Tạm tính (chưa gồm giảm giá)</span>
                        <span>{fmt((payBill.chi_tiet_hoa_don || []).reduce((s, ct) => s + ct.DonGia * ct.SoLuong, 0))}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
                        Voucher (nếu có) sẽ được áp dụng khi bấm thanh toán.
                    </div>
                    <button className="btn-success" onClick={handleThanhToan} disabled={loading}>
                        {loading ? 'Đang xử lý...' : '💳 Thanh toán'}
                    </button>
                </div>
            )}

            {soBan && (
                <div className="tao-hd-layout">
                    <div className="tao-hd-left">
                        <div className="staff-card">
                            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Chọn vé cho bàn {soBan}</h3>
                            {Object.keys(grouped).length === 0 ? (
                                <div className="alert-info">Không có vé nào áp dụng cho thời điểm hiện tại.</div>
                            ) : Object.entries(grouped).map(([buoi, list]) => (
                                <div key={buoi} style={{ marginBottom: 20 }}>
                                    <div className="buoi-label">{BUOI_LABEL[buoi] || buoi}</div>
                                    {list.map((ve) => (
                                        <div key={ve.MaLoaiVe} className="ve-row">
                                            <div style={{ flex: 1 }}>
                                                <div className="ve-name">{ve.TenLoaiVe}</div>
                                                <div className="ve-meta">{NGAY_LABEL[ve.LoaiNgay] || ve.LoaiNgay} · {fmt(ve.GiaVe)}/vé</div>
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

                        <div className="staff-card">
                            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Thành viên (tùy chọn)</h3>
                            {!khachHang ? (
                                <div className="sdt-row">
                                    <input className="staff-input" placeholder="Nhập số điện thoại thành viên..."
                                        value={sdtInput} onChange={(e) => setSdtInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()} />
                                    <button className="btn-primary" style={{ minWidth: 90 }} onClick={handleLookup} disabled={sdtLoading}>
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
                            {vouchers.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <div className="voucher-title">Voucher có thể áp dụng</div>
                                    {vouchers.map((v) => {
                                        const checked = selected.includes(v.MaVoucherKhachHang);
                                        return (
                                            <label key={v.MaVoucherKhachHang} className="voucher-item"
                                                style={{ borderColor: checked ? '#16a34a' : '#e5e7eb', background: checked ? '#f0fdf4' : '#fff' }}>
                                                <input type="checkbox" checked={checked}
                                                    onChange={() => toggleVoucher(v.MaVoucherKhachHang)}
                                                    style={{ marginRight: 10, accentColor: '#16a34a' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div className="voucher-name">{v.TenUuDai}</div>
                                                    <div className="voucher-sub">
                                                        {NHOM_LABEL[v.NhomUuDai] || v.NhomUuDai}
                                                        {v.NhomUuDai === 'PhanTram' ? ` · Giảm ${v.GiaTriGiam}%` : ` · ${fmt(v.GiaTriGiam)}`}
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

                    <div className="tao-hd-right">
                        <div className="staff-card" style={{ position: 'sticky', top: 16 }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Tóm tắt · Bàn {soBan}</h3>
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
                                    <div className="summary-row"><span>Tạm tính</span><span>{fmt(tongTienGoc)}</span></div>
                                    {tongGiam > 0 && (
                                        <div className="summary-row" style={{ color: '#16a34a' }}>
                                            <span>Giảm giá (dự kiến)</span><span>−{fmt(tongGiam)}</span>
                                        </div>
                                    )}
                                    <div className="divider" />
                                    <div className="summary-row" style={{ fontWeight: 700, fontSize: 18 }}>
                                        <span>Tổng dự kiến</span>
                                        <span style={{ color: '#b45309' }}>{fmt(tongThanhToan)}</span>
                                    </div>
                                    <div className="diem-note" style={{ fontSize: 12 }}>
                                        Điểm tích lũy sẽ được tính chính xác khi thanh toán.
                                    </div>
                                </>
                            )}
                            {error && <div className="alert-danger">{error}</div>}
                            <button className="btn-success" onClick={handleMoBan} disabled={cartItems.length === 0 || loading}>
                                {loading ? 'Đang xử lý...' : `📌 Mở bàn ${soBan} (treo hóa đơn)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!soBan && !payBill && (
                <div className="staff-card">
                    <div className="empty-cart">Chọn một bàn trống ở trên để bắt đầu tạo hóa đơn.</div>
                </div>
            )}
        </div>
    );
}

function legendDot(bg, border) {
    return {
        display: 'inline-block', width: 12, height: 12, borderRadius: 3,
        background: bg, border: `1px solid ${border}`, verticalAlign: 'middle', marginRight: 4,
    };
}