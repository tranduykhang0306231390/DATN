// src/pages/staff/TaoHoaDon.jsx
// Luồng: Mở bàn -> Gọi thêm / Đổi bàn / Hủy bàn -> Thanh toán (hỏi thành viên)
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import hoaDonApi from '../../api/hoaDonApi';
import '../../assets/css/staff.css';
import { fmt, BUOI_LABEL, NGAY_LABEL, NHOM_LABEL, PageTitle } from '../../components/staff/StaffComponents';
import {
    dot, ovl, box, mHead, mBody, mFoot, mClose,
    sumBox, sumRow, pointBox, pointBoxGray,
    btnClose, btnPay, btnFull, btnGrid, btnCell,
} from './taoHoaDonStyles';

const TONG_SO_BAN = 20;

export default function TaoHoaDon() {
    const [loaiVeList, setLoaiVeList] = useState([]);
    const [banTreo, setBanTreo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Chế độ: null | 'moBan' | 'xemBan'
    const [mode, setMode] = useState(null);
    const [soBan, setSoBan] = useState(null);   // bàn trống đang chọn để mở
    const [bill, setBill] = useState(null);     // hóa đơn treo đang xem

    const [cart, setCart] = useState({});       // giỏ vé (dùng cho mở bàn & gọi thêm)
    const [dangGoiThem, setDangGoiThem] = useState(false);

    // Thanh toán
    const [payOpen, setPayOpen] = useState(false);
    const [sdt, setSdt] = useState('');
    const [khachHang, setKhachHang] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [selected, setSelected] = useState([]);
    const [sdtLoading, setSdtLoading] = useState(false);
    const [sdtError, setSdtError] = useState('');
    const [uoc, setUoc] = useState(null);        // kết quả ước tính từ server
    const [uocLoading, setUocLoading] = useState(false);

    const banTreoMap = banTreo.reduce((acc, hd) => {
        acc[String(hd.SoBan)] = hd;
        return acc;
    }, {});

    const loadBanTreo = useCallback(async () => {
        try {
            const res = await hoaDonApi.banDangTreo();
            const list = res.data.data || [];
            setBanTreo(list);
            return list;
        } catch {
            setBanTreo([]);
            return [];
        }
    }, []);

    useEffect(() => {
        hoaDonApi.getLoaiVe()
            .then((res) => setLoaiVeList(res.data.data))
            .catch(() => setError('Không tải được danh sách vé.'));
        loadBanTreo();
    }, [loadBanTreo]);

    // ── Chọn bàn ────────────────────────────────────────────────
    const chonBan = (n) => {
        const hd = banTreoMap[String(n)];
        setCart({});
        setDangGoiThem(false);
        setError('');
        if (hd) {
            setBill(hd);
            setSoBan(null);
            setMode('xemBan');
        } else {
            setSoBan(n);
            setBill(null);
            setMode('moBan');
        }
    };

    const dong = () => {
        setMode(null); setSoBan(null); setBill(null);
        setCart({}); setDangGoiThem(false); setError('');
    };

    // ── Giỏ vé ──────────────────────────────────────────────────
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
    const tongCart = cartItems.reduce((s, i) => s + i.ThanhTien, 0);
    const payload = () => ({ chi_tiet: cartItems.map((i) => ({ MaLoaiVe: i.MaLoaiVe, SoLuong: i.SoLuong })) });

    // ── 1. Mở bàn ───────────────────────────────────────────────
    const handleMoBan = async () => {
        if (cartItems.length === 0) { setError('Vui lòng chọn ít nhất 1 vé.'); return; }
        setLoading(true); setError('');
        try {
            await hoaDonApi.moBan({ so_ban: soBan, ...payload() });
            Swal.fire({ icon: 'success', title: `Đã mở bàn ${soBan}`, timer: 1400, showConfirmButton: false });
            await loadBanTreo();
            dong();
        } catch (e) {
            setError(e.response?.data?.message || 'Không mở được bàn.');
        } finally { setLoading(false); }
    };

    // ── 2. Gọi thêm ─────────────────────────────────────────────
    const handleThemMon = async () => {
        if (cartItems.length === 0) { setError('Vui lòng chọn vé muốn thêm.'); return; }
        setLoading(true); setError('');
        try {
            await hoaDonApi.themMon(bill.MaHoaDon, payload());
            Swal.fire({ icon: 'success', title: 'Đã thêm vào bàn', timer: 1400, showConfirmButton: false });
            const list = await loadBanTreo();
            setBill(list.find((h) => h.MaHoaDon === bill.MaHoaDon) || null);
            setCart({}); setDangGoiThem(false);
        } catch (e) {
            setError(e.response?.data?.message || 'Không thêm được.');
        } finally { setLoading(false); }
    };

    // ── 3. Đổi bàn ──────────────────────────────────────────────
    const handleDoiBan = async () => {
        const trong = Array.from({ length: TONG_SO_BAN }, (_, i) => i + 1)
            .filter((n) => !banTreoMap[String(n)]);
        if (trong.length === 0) {
            Swal.fire('Không còn bàn trống', 'Tất cả các bàn đang có khách.', 'info');
            return;
        }
        // Lưới 3 cột, bấm chọn trực tiếp — không phải kéo dropdown
        const html = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px">
                ${trong.map((n) => `
                    <button type="button" class="swal-pick-ban" data-ban="${n}"
                        style="padding:14px 4px;border-radius:10px;border:1px solid #bbf7d0;
                               background:#dcfce7;color:#15803d;font-weight:700;font-size:14px;
                               cursor:pointer;font-family:inherit">
                        Bàn ${n}
                    </button>`).join('')}
            </div>`;

        const banMoi = await new Promise((resolve) => {
            let picked = null;
            Swal.fire({
                title: `Chuyển bàn ${bill.SoBan} sang bàn nào?`,
                html,
                width: 420,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Hủy',
                didOpen: () => {
                    document.querySelectorAll('.swal-pick-ban').forEach((btn) => {
                        btn.addEventListener('mouseenter', () => {
                            btn.style.background = '#16a34a'; btn.style.color = '#fff';
                        });
                        btn.addEventListener('mouseleave', () => {
                            btn.style.background = '#dcfce7'; btn.style.color = '#15803d';
                        });
                        btn.addEventListener('click', () => {
                            picked = Number(btn.dataset.ban);
                            Swal.close();
                        });
                    });
                },
                willClose: () => resolve(picked),
            });
        });
        if (!banMoi) return;
        try {
            const res = await hoaDonApi.doiBan(bill.MaHoaDon, Number(banMoi));
            Swal.fire({ icon: 'success', title: res.data.message, timer: 1600, showConfirmButton: false });
            const list = await loadBanTreo();
            setBill(list.find((h) => h.MaHoaDon === bill.MaHoaDon) || null);
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không đổi được bàn.', 'error');
        }
    };

    // ── 4. Hủy bàn ──────────────────────────────────────────────
    const handleHuyBan = async () => {
        const c = await Swal.fire({
            title: `Hủy bàn ${bill.SoBan}?`,
            text: 'Hóa đơn sẽ bị hủy và bàn được giải phóng. Khách không được tích điểm.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận hủy',
            cancelButtonText: 'Không',
            confirmButtonColor: '#dc2626',
        });
        if (!c.isConfirmed) return;
        try {
            await hoaDonApi.huyBan(bill.MaHoaDon);
            Swal.fire({ icon: 'success', title: 'Đã hủy bàn', timer: 1400, showConfirmButton: false });
            await loadBanTreo();
            dong();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không hủy được bàn.', 'error');
        }
    };

    // ── 5. Thanh toán ───────────────────────────────────────────
    const moThanhToan = () => {
        setSdt(''); setKhachHang(null); setVouchers([]); setSelected([]); setSdtError('');
        setUoc(null); setPayOpen(true);
    };

    const handleLookup = async () => {
        setSdtError(''); setKhachHang(null); setVouchers([]); setSelected([]);
        if (!sdt.trim()) return;
        setSdtLoading(true);
        try {
            const res = await hoaDonApi.lookupKhachHang(sdt.trim());
            if (res.data.success) { setKhachHang(res.data.khachHang); setVouchers(res.data.vouchers); }
        } catch (e) {
            setSdtError(e.response?.data?.message || 'Không tìm thấy khách hàng.');
        } finally { setSdtLoading(false); }
    };

    const toggleVoucher = (ma) =>
        setSelected((p) => p.includes(ma) ? p.filter((x) => x !== ma) : [...p, ma]);

    const tongBill = (bill?.chi_tiet_hoa_don || []).reduce((s, ct) => s + ct.DonGia * ct.SoLuong, 0);

    // Gọi server ước tính lại mỗi khi đổi khách hoặc voucher — dùng chung
    // logic với thanh toán nên số dự kiến luôn khớp số thật.
    useEffect(() => {
        if (!payOpen || !bill) return;
        let huy = false;
        setUocLoading(true);
        hoaDonApi.uocTinh(bill.MaHoaDon, {
            ma_khach_hang: khachHang?.MaKhachHang || null,
            vouchers_ap_dung: selected,
        })
            .then((res) => { if (!huy && res.data?.success) setUoc(res.data.data); })
            .catch(() => { if (!huy) setUoc(null); })
            .finally(() => { if (!huy) setUocLoading(false); });
        return () => { huy = true; };
    }, [payOpen, bill, khachHang, selected]);

    const handleThanhToan = async () => {
        setLoading(true);
        try {
            const res = await hoaDonApi.thanhToan(bill.MaHoaDon, {
                ma_khach_hang: khachHang?.MaKhachHang || null,
                vouchers_ap_dung: selected,
            });
            const d = res.data.data;
            setPayOpen(false);
            await loadBanTreo();
            dong();
            Swal.fire({
                icon: 'success',
                title: 'Thanh toán thành công',
                html: `Hóa đơn <b>${d.MaHoaDon}</b><br>Tổng thu: <b>${fmt(d.TongThanhToan)}</b>` +
                      (d.TongGiam > 0 ? `<br>Đã giảm: ${fmt(d.TongGiam)}` : '') +
                      (d.DiemTichLuy > 0 ? `<br>Điểm tích lũy: <b>+${d.DiemTichLuy}</b>` : ''),
            });
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thanh toán được.', 'error');
        } finally { setLoading(false); }
    };

    const grouped = loaiVeList.reduce((acc, v) => {
        (acc[v.BuoiAn] = acc[v.BuoiAn] || []).push(v);
        return acc;
    }, {});

    // ── Khối chọn vé (dùng chung cho mở bàn & gọi thêm) ──────────
    const KhoiChonVe = ({ title }) => (
        <div className="staff-card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>{title}</h3>
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
    );

    return (
        <div className="staff-page">
            <PageTitle>🧾 Quản lý bàn &amp; hóa đơn</PageTitle>

            {/* ══ LƯỚI BÀN ══ */}
            <div className="staff-card" style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Sơ đồ bàn</h3>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                    <span style={dot('#dcfce7', '#16a34a')} /> Trống &nbsp;&nbsp;
                    <span style={dot('#fee2e2', '#dc2626')} /> Đang phục vụ
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 10 }}>
                    {Array.from({ length: TONG_SO_BAN }, (_, i) => i + 1).map((n) => {
                        const hd = banTreoMap[String(n)];
                        const active = (soBan === n) || (bill && Number(bill.SoBan) === n);
                        return (
                            <button key={n} type="button" onClick={() => chonBan(n)}
                                style={{
                                    padding: '14px 8px', borderRadius: 10,
                                    border: active ? '2px solid #111827' : '1px solid transparent',
                                    cursor: 'pointer', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
                                    background: hd ? '#fee2e2' : '#dcfce7',
                                    color: hd ? '#b91c1c' : '#15803d',
                                }}>
                                Bàn {n}
                                <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                                    {hd ? 'Đang phục vụ' : 'Trống'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ══ CHẾ ĐỘ MỞ BÀN ══ */}
            {mode === 'moBan' && (
                <div className="tao-hd-layout">
                    <div className="tao-hd-left">
                        <KhoiChonVe title={`Chọn vé cho bàn ${soBan}`} />
                    </div>
                    <div className="tao-hd-right">
                        <div className="staff-card" style={{ position: 'sticky', top: 16 }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Mở bàn {soBan}</h3>
                            {cartItems.length === 0 ? <div className="empty-cart">Chưa chọn vé nào</div> : (
                                <>
                                    {cartItems.map((i) => (
                                        <div key={i.MaLoaiVe} className="summary-row">
                                            <span style={{ flex: 1 }}>{i.TenLoaiVe} × {i.SoLuong}</span>
                                            <span>{fmt(i.ThanhTien)}</span>
                                        </div>
                                    ))}
                                    <div className="divider" />
                                    <div className="summary-row" style={{ fontWeight: 700, fontSize: 17 }}>
                                        <span>Tạm tính</span>
                                        <span style={{ color: '#b45309' }}>{fmt(tongCart)}</span>
                                    </div>
                                    <div className="diem-note" style={{ fontSize: 12 }}>
                                        Thành viên và ưu đãi sẽ được hỏi khi thanh toán.
                                    </div>
                                </>
                            )}
                            {error && <div className="alert-danger">{error}</div>}
                            <button className="btn-success" onClick={handleMoBan}
                                disabled={cartItems.length === 0 || loading}>
                                {loading ? 'Đang xử lý...' : `📌 Mở bàn ${soBan}`}
                            </button>
                            <button className="btn-ghost" style={{ width: '100%', marginTop: 8, marginLeft: 0 }} onClick={dong}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ CHẾ ĐỘ XEM BÀN ĐANG PHỤC VỤ ══ */}
            {mode === 'xemBan' && bill && (
                <div className="tao-hd-layout">
                    <div className="tao-hd-left">
                        {dangGoiThem
                            ? <KhoiChonVe title={`Gọi thêm cho bàn ${bill.SoBan}`} />
                            : (
                                <div className="staff-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                                            Bàn {bill.SoBan} · {bill.MaHoaDon}
                                        </h3>
                                        <span style={{ fontSize: 12, color: '#9ca3af' }}>
                                            Mở lúc {new Date(String(bill.NgayLap).replace(' ', 'T')).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    <table className="staff-table">
                                        <thead>
                                            <tr>
                                                <th>Loại vé</th>
                                                <th style={{ textAlign: 'center' }}>SL</th>
                                                <th style={{ textAlign: 'right' }}>Đơn giá</th>
                                                <th style={{ textAlign: 'right' }}>Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(bill.chi_tiet_hoa_don || []).map((ct) => (
                                                <tr key={ct.MaChiTietHD}>
                                                    <td>{ct.loai_ve?.TenLoaiVe || ct.MaLoaiVe}</td>
                                                    <td style={{ textAlign: 'center' }}>{ct.SoLuong}</td>
                                                    <td style={{ textAlign: 'right' }}>{fmt(ct.DonGia)}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(ct.DonGia * ct.SoLuong)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    </div>

                    <div className="tao-hd-right">
                        <div className="staff-card" style={{ position: 'sticky', top: 16 }}>
                            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
                                {dangGoiThem ? 'Vé gọi thêm' : `Bàn ${bill.SoBan}`}
                            </h3>

                            {dangGoiThem ? (
                                <>
                                    {cartItems.length === 0 ? <div className="empty-cart">Chưa chọn vé nào</div> : (
                                        <>
                                            {cartItems.map((i) => (
                                                <div key={i.MaLoaiVe} className="summary-row">
                                                    <span style={{ flex: 1 }}>{i.TenLoaiVe} × {i.SoLuong}</span>
                                                    <span>{fmt(i.ThanhTien)}</span>
                                                </div>
                                            ))}
                                            <div className="divider" />
                                            <div className="summary-row" style={{ fontWeight: 700 }}>
                                                <span>Thêm</span><span>{fmt(tongCart)}</span>
                                            </div>
                                        </>
                                    )}
                                    {error && <div className="alert-danger">{error}</div>}
                                    <button className="btn-success" onClick={handleThemMon}
                                        disabled={cartItems.length === 0 || loading}>
                                        {loading ? 'Đang thêm...' : '✅ Xác nhận gọi thêm'}
                                    </button>
                                    <button className="btn-ghost" style={{ width: '100%', marginTop: 8, marginLeft: 0 }}
                                        onClick={() => { setDangGoiThem(false); setCart({}); setError(''); }}>
                                        Quay lại
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="summary-row" style={{ fontWeight: 700, fontSize: 18 }}>
                                        <span>Tạm tính</span>
                                        <span style={{ color: '#b45309' }}>{fmt(tongBill)}</span>
                                    </div>
                                    <div className="divider" />
                                    {/* 4 nút xếp lưới 2x2:
                                        Gọi thêm | Đổi bàn
                                        Hủy bàn  | Thanh toán */}
                                    <div style={btnGrid}>
                                        <button className="btn-primary" style={btnCell}
                                            onClick={() => { setCart({}); setDangGoiThem(true); }}>
                                            ➕ Gọi thêm
                                        </button>
                                        <button className="btn-outline" style={btnCell}
                                            onClick={handleDoiBan}>
                                            🔄 Đổi bàn
                                        </button>
                                        <button className="btn-danger" style={btnCell}
                                            onClick={handleHuyBan}>
                                            🚫 Hủy bàn
                                        </button>
                                        <button className="btn-success" style={btnCell}
                                            onClick={moThanhToan}>
                                            💳 Thanh toán
                                        </button>
                                    </div>
                                    <button className="btn-ghost"
                                        style={{ width: '100%', marginTop: 10, marginLeft: 0 }}
                                        onClick={dong}>
                                        Đóng
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!mode && (
                <div className="staff-card">
                    <div className="empty-cart">Chọn một bàn để bắt đầu.</div>
                </div>
            )}

            {/* ══ MODAL THANH TOÁN ══
                Dùng createPortal đưa modal ra thẳng document.body để
                position:fixed luôn tính theo màn hình, không bị "trói"
                bởi phần tử cha có transform / filter / contain. */}
            {payOpen && bill && createPortal(
                <div style={ovl} onClick={() => setPayOpen(false)}>
                    <div style={box} onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div style={mHead}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>
                                    Thanh toán bàn {bill.SoBan}
                                </div>
                                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
                                    {bill.MaHoaDon}
                                </div>
                            </div>
                            <button onClick={() => setPayOpen(false)} style={mClose}>✕</button>
                        </div>

                        {/* Body */}
                        <div style={mBody}>
                            <div style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>
                                Khách có phải thành viên không?
                            </div>

                            {!khachHang ? (
                                <>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input className="staff-input" placeholder="Nhập số điện thoại thành viên..."
                                            value={sdt} onChange={(e) => setSdt(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleLookup()} />
                                        <button className="btn-primary" style={{ minWidth: 90 }}
                                            onClick={handleLookup} disabled={sdtLoading}>
                                            {sdtLoading ? '...' : 'Tra cứu'}
                                        </button>
                                    </div>
                                    {sdtError && <div className="alert-warn">{sdtError}</div>}
                                    <div className="alert-info">
                                        Bỏ qua bước này nếu khách không phải thành viên.
                                    </div>
                                </>
                            ) : (
                                <div className="kh-row">
                                    <div className="kh-badge">{khachHang.TenHang}</div>
                                    <div>
                                        <div className="kh-name">{khachHang.HoTen}</div>
                                        <div className="kh-sub">{khachHang.SoDienThoai} · {khachHang.TongDiem} điểm</div>
                                    </div>
                                    <button className="btn-ghost" onClick={() => {
                                        setKhachHang(null); setVouchers([]); setSelected([]); setSdt('');
                                    }}>✕ Bỏ</button>
                                </div>
                            )}

                            {vouchers.length > 0 && (
                                <div style={{ marginTop: 14 }}>
                                    <div className="voucher-title">Voucher có thể áp dụng</div>
                                    {vouchers.map((v) => {
                                        const ck = selected.includes(v.MaVoucherKhachHang);
                                        return (
                                            <label key={v.MaVoucherKhachHang} className="voucher-item"
                                                style={{ borderColor: ck ? '#16a34a' : '#e5e7eb', background: ck ? '#f0fdf4' : '#fff' }}>
                                                <input type="checkbox" checked={ck}
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
                                                {ck && <span className="voucher-check">✓</span>}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {khachHang && vouchers.length === 0 && (
                                <div className="alert-info">
                                    Khách không có voucher khả dụng.
                                </div>
                            )}

                            {/* Tổng kết — lấy từ server */}
                            <div style={sumBox}>
                                <div style={sumRow}>
                                    <span>Tạm tính</span>
                                    <span>{fmt(uoc ? uoc.TongTienGoc : tongBill)}</span>
                                </div>
                                {uoc && uoc.TongGiam > 0 && (
                                    <div style={{ ...sumRow, color: '#16a34a' }}>
                                        <span>Giảm giá ({uoc.SoVoucherApDung} voucher)</span>
                                        <span>−{fmt(uoc.TongGiam)}</span>
                                    </div>
                                )}
                                <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />
                                <div style={{ ...sumRow, fontWeight: 700, fontSize: 18 }}>
                                    <span>Khách trả</span>
                                    <span style={{ color: '#b45309' }}>
                                        {uocLoading ? '…' : fmt(uoc ? uoc.TongThanhToan : tongBill)}
                                    </span>
                                </div>
                            </div>

                            {/* Điểm tích lũy dự kiến */}
                            {khachHang && (
                                <div style={uoc && uoc.DiemTichLuy > 0 ? pointBox : pointBoxGray}>
                                    {uocLoading ? 'Đang tính điểm…'
                                        : uoc && uoc.DiemTichLuy > 0 ? (
                                            <>
                                                ⭐ Điểm tích lũy: <b>+{uoc.DiemTichLuy} điểm</b>
                                                {uoc.LaSinhNhat && <span> 🎂 (đã nhân đôi sinh nhật)</span>}
                                                <div style={{ fontSize: 12, marginTop: 4 }}>
                                                    Điểm sau giao dịch: <b>{khachHang.TongDiem + uoc.DiemTichLuy}</b>
                                                </div>
                                            </>
                                        ) : 'Hóa đơn này không đủ điều kiện tích điểm.'}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={mFoot}>
                            <button onClick={() => setPayOpen(false)} style={btnClose}>Đóng</button>
                            <button onClick={handleThanhToan} disabled={loading || uocLoading} style={btnPay}>
                                {loading ? 'Đang xử lý...' : '💳 Xác nhận thanh toán'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}