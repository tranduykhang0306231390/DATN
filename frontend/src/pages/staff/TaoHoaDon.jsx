import { useState, useEffect, useCallback } from 'react';
import hoaDonApi from '../../api/hoaDonApi';
const fmt = (n) =>
  Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const BUOI_LABEL  = { Trua: '🌤 Trưa',  Toi: '🌙 Tối' };
const NGAY_LABEL  = { NgayThuong: 'Ngày thường', CuoiTuan: 'Cuối tuần' };
const NHOM_LABEL  = { GiamTien: 'Giảm tiền', PhanTram: 'Giảm %', TangMon: 'Tặng món' };

// ─── component ──────────────────────────────────────────────────────────────
export default function TaoHoaDon() {
  const [loaiVeList, setLoaiVeList] = useState([]);
  const [cart, setCart]             = useState({});        // { MaLoaiVe: SoLuong }
  const [sdt, setSdt]               = useState('');
  const [sdtInput, setSdtInput]     = useState('');
  const [khachHang, setKhachHang]   = useState(null);
  const [vouchers, setVouchers]     = useState([]);
  const [selected, setSelected]     = useState([]);        // MaVoucherKhachHang[]
  const [loading, setLoading]       = useState(false);
  const [sdtLoading, setSdtLoading] = useState(false);
  const [result, setResult]         = useState(null);      // kết quả hóa đơn
  const [error, setError]           = useState('');
  const [sdtError, setSdtError]     = useState('');

  // Tải loại vé
  useEffect(() => {
    hoaDonApi.getLoaiVe()
      .then((res) => setLoaiVeList(res.data.data))
      .catch(() => setError('Không tải được danh sách vé.'));
  }, []);

  // ── giỏ vé ──────────────────────────────────────────────────────────────
  const setQty = (maVe, delta) => {
    setCart((prev) => {
      const cur = (prev[maVe] || 0) + delta;
      if (cur <= 0) {
        const next = { ...prev };
        delete next[maVe];
        return next;
      }
      return { ...prev, [maVe]: cur };
    });
  };

  const cartItems = loaiVeList
    .filter((v) => cart[v.MaLoaiVe])
    .map((v) => ({ ...v, SoLuong: cart[v.MaLoaiVe], ThanhTien: v.GiaVe * cart[v.MaLoaiVe] }));

  const tongTienGoc = cartItems.reduce((s, i) => s + i.ThanhTien, 0);

  // ── tính giảm preview ────────────────────────────────────────────────────
  const tinhGiam = useCallback(() => {
    let giam = 0;
    const nhomDung = {};
    const sorted   = [...vouchers]
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

  const tongGiam       = tinhGiam();
  const tongThanhToan  = tongTienGoc - tongGiam;

  // ── tra cứu KH ──────────────────────────────────────────────────────────
  const handleLookup = async () => {
    setSdtError('');
    setKhachHang(null);
    setVouchers([]);
    setSelected([]);
    if (!sdtInput.trim()) return;
    setSdtLoading(true);
    try {
      const res = await hoaDonApi.lookupKhachHang(sdtInput.trim());
      if (res.data.success) {
        setKhachHang(res.data.khachHang);
        setVouchers(res.data.vouchers);
        setSdt(sdtInput.trim());
      }
    } catch (e) {
      setSdtError(e.response?.data?.message || 'Không tìm thấy khách hàng.');
    } finally {
      setSdtLoading(false);
    }
  };

  const handleClearKH = () => {
    setSdtInput('');
    setSdt('');
    setKhachHang(null);
    setVouchers([]);
    setSelected([]);
    setSdtError('');
  };

  // ── toggle chọn voucher ──────────────────────────────────────────────────
  const toggleVoucher = (maVKH) => {
    setSelected((prev) =>
      prev.includes(maVKH) ? prev.filter((x) => x !== maVKH) : [...prev, maVKH]
    );
  };

  // ── tạo hóa đơn ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (cartItems.length === 0) { setError('Vui lòng chọn ít nhất 1 vé.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = {
        chi_tiet: cartItems.map((i) => ({ MaLoaiVe: i.MaLoaiVe, SoLuong: i.SoLuong })),
        ma_khach_hang:    khachHang?.MaKhachHang || null,
        vouchers_ap_dung: selected,
      };
      const res = await hoaDonApi.taoHoaDon(payload);
      if (res.data.success) {
        setResult(res.data.data);
        setCart({});
        setKhachHang(null);
        setVouchers([]);
        setSelected([]);
        setSdtInput('');
        setSdt('');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => setResult(null);

  // ────────────────────────────────────────────────────────────────────────
  if (result) return <HoaDonResult result={result} onNew={handleNewOrder} />;

  // nhóm loại vé theo buổi
  const grouped = loaiVeList.reduce((acc, v) => {
    const key = v.BuoiAn;
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  return (
    <div style={styles.page}>
      <h2 style={styles.pageTitle}>🧾 Tạo hóa đơn tại quầy</h2>

      <div style={styles.layout}>
        {/* ── CỘT TRÁI: chọn vé ────────────────────────────────────── */}
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Chọn vé</h3>

            {Object.entries(grouped).map(([buoi, list]) => (
              <div key={buoi} style={{ marginBottom: 20 }}>
                <div style={styles.buoiLabel}>{BUOI_LABEL[buoi] || buoi}</div>
                {list.map((ve) => (
                  <div key={ve.MaLoaiVe} style={styles.veRow}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.veName}>{ve.TenLoaiVe}</div>
                      <div style={styles.veMeta}>
                        {NGAY_LABEL[ve.LoaiNgay] || ve.LoaiNgay} · {fmt(ve.GiaVe)}/vé
                      </div>
                    </div>
                    <div style={styles.qtyControl}>
                      <button style={styles.qtyBtn} onClick={() => setQty(ve.MaLoaiVe, -1)}>−</button>
                      <span style={styles.qtyNum}>{cart[ve.MaLoaiVe] || 0}</span>
                      <button style={styles.qtyBtn} onClick={() => setQty(ve.MaLoaiVe, +1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Tra cứu thành viên ─────────────────────────── */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Thành viên (tùy chọn)</h3>

            {!khachHang ? (
              <div style={styles.sdtRow}>
                <input
                  style={styles.input}
                  placeholder="Nhập số điện thoại thành viên..."
                  value={sdtInput}
                  onChange={(e) => setSdtInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                />
                <button
                  style={{ ...styles.btnPrimary, minWidth: 90 }}
                  onClick={handleLookup}
                  disabled={sdtLoading}
                >
                  {sdtLoading ? '...' : 'Tra cứu'}
                </button>
              </div>
            ) : (
              <div style={styles.khRow}>
                <div style={styles.khBadge}>{khachHang.TenHang}</div>
                <div>
                  <div style={styles.khName}>{khachHang.HoTen}</div>
                  <div style={styles.khSub}>{khachHang.SoDienThoai} · {khachHang.TongDiem} điểm</div>
                </div>
                <button style={styles.btnGhost} onClick={handleClearKH}>✕ Xóa</button>
              </div>
            )}

            {sdtError && <div style={styles.alertWarn}>{sdtError}</div>}

            {/* Danh sách voucher */}
            {vouchers.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={styles.voucherTitle}>Voucher có thể áp dụng</div>
                {vouchers.map((v) => {
                  const checked = selected.includes(v.MaVoucherKhachHang);
                  return (
                    <label key={v.MaVoucherKhachHang} style={{
                      ...styles.voucherItem,
                      borderColor: checked ? '#16a34a' : '#e5e7eb',
                      background:  checked ? '#f0fdf4' : '#fff',
                    }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVoucher(v.MaVoucherKhachHang)}
                        style={{ marginRight: 10, accentColor: '#16a34a' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={styles.voucherName}>{v.TenUuDai}</div>
                        <div style={styles.voucherSub}>
                          {NHOM_LABEL[v.NhomUuDai] || v.NhomUuDai}
                          {v.NhomUuDai === 'PhanTram'
                            ? ` · Giảm ${v.GiaTriGiam}%`
                            : ` · ${fmt(v.GiaTriGiam)}`}
                          {' · HSD: '}{v.NgayHetHan}
                        </div>
                      </div>
                      {checked && <span style={styles.voucherCheck}>✓</span>}
                    </label>
                  );
                })}
              </div>
            )}

            {khachHang && vouchers.length === 0 && (
              <div style={styles.alertInfo}>Khách hàng không có voucher nào khả dụng.</div>
            )}
          </div>
        </div>

        {/* ── CỘT PHẢI: tóm tắt & thanh toán ──────────────────────── */}
        <div style={styles.rightCol}>
          <div style={{ ...styles.card, position: 'sticky', top: 16 }}>
            <h3 style={styles.sectionTitle}>Tóm tắt hóa đơn</h3>

            {cartItems.length === 0 ? (
              <div style={styles.emptyCart}>Chưa chọn vé nào</div>
            ) : (
              <>
                {cartItems.map((i) => (
                  <div key={i.MaLoaiVe} style={styles.summaryRow}>
                    <span style={{ flex: 1 }}>{i.TenLoaiVe} × {i.SoLuong}</span>
                    <span>{fmt(i.ThanhTien)}</span>
                  </div>
                ))}

                <div style={styles.divider} />

                <div style={styles.summaryRow}>
                  <span>Tạm tính</span>
                  <span>{fmt(tongTienGoc)}</span>
                </div>

                {tongGiam > 0 && (
                  <div style={{ ...styles.summaryRow, color: '#16a34a' }}>
                    <span>Giảm giá</span>
                    <span>−{fmt(tongGiam)}</span>
                  </div>
                )}

                <div style={styles.divider} />

                <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: 18 }}>
                  <span>Tổng thanh toán</span>
                  <span style={{ color: '#b45309' }}>{fmt(tongThanhToan)}</span>
                </div>

                {khachHang && (
                  <div style={styles.diemNote}>
                    🌟 Điểm tích lũy dự kiến:{' '}
                    <strong>+{Math.floor(tongThanhToan / 10000)} điểm</strong>
                  </div>
                )}
              </>
            )}

            {error && <div style={styles.alertDanger}>{error}</div>}

            <button
              style={{
                ...styles.btnSubmit,
                opacity: cartItems.length === 0 || loading ? 0.5 : 1,
                cursor:  cartItems.length === 0 || loading ? 'not-allowed' : 'pointer',
              }}
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

// ─── kết quả hóa đơn ────────────────────────────────────────────────────────
function HoaDonResult({ result, onNew }) {
  const fmt = (n) =>
    Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  return (
    <div style={{ ...styles.page, display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...styles.card, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
        <h2 style={{ margin: '0 0 4px', color: '#15803d' }}>Hóa đơn tạo thành công!</h2>
        <div style={{ color: '#6b7280', marginBottom: 24 }}>Mã hóa đơn: <strong>{result.MaHoaDon}</strong></div>

        <div style={styles.resultGrid}>
          <ResultRow label="Tổng tiền gốc"    value={fmt(result.TongTienGoc)} />
          <ResultRow label="Giảm giá"         value={`−${fmt(result.TongGiam)}`} color="#16a34a" />
          <ResultRow label="Thanh toán"       value={fmt(result.TongThanhToan)} bold accent />
          {result.DiemTichLuy > 0 && (
            <ResultRow label="Điểm tích lũy"  value={`+${result.DiemTichLuy} điểm`} color="#d97706" />
          )}
        </div>

        <button style={{ ...styles.btnSubmit, marginTop: 24 }} onClick={onNew}>
          + Tạo hóa đơn mới
        </button>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color, bold, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{
        color:      accent ? '#b45309' : (color || '#111827'),
        fontWeight: bold   ? 700        : 400,
        fontSize:   accent ? 18         : 15,
      }}>{value}</span>
    </div>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────
const styles = {
  page: {
    padding: '24px 16px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: '#f9fafb',
    minHeight: '100vh',
  },
  pageTitle: {
    margin: '0 0 20px',
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
  },
  layout: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  leftCol:  { flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 16 },
  rightCol: { flex: '0 0 300px', minWidth: 260 },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,.08)',
  },
  sectionTitle: { margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#374151' },
  buoiLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  veRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  veName: { fontSize: 14, fontWeight: 500, color: '#111827' },
  veMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: '#374151',
  },
  qtyNum: { minWidth: 24, textAlign: 'center', fontWeight: 600, fontSize: 15 },
  sdtRow: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  },
  khRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    background: '#f0fdf4',
    borderRadius: 8,
    border: '1px solid #bbf7d0',
  },
  khBadge: {
    background: '#16a34a',
    color: '#fff',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  khName: { fontWeight: 600, fontSize: 14, color: '#111827' },
  khSub:  { fontSize: 12, color: '#6b7280', marginTop: 2 },
  voucherTitle: { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  voucherItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1.5px solid',
    marginBottom: 8,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  voucherName: { fontSize: 14, fontWeight: 500, color: '#111827' },
  voucherSub:  { fontSize: 12, color: '#6b7280', marginTop: 2 },
  voucherCheck:{ color: '#16a34a', fontWeight: 700, marginLeft: 8 },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#374151',
    padding: '6px 0',
  },
  divider:    { height: 1, background: '#f3f4f6', margin: '8px 0' },
  emptyCart:  { color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '20px 0' },
  diemNote:   { fontSize: 13, color: '#92400e', background: '#fffbeb', borderRadius: 8, padding: '8px 12px', marginTop: 12 },
  alertWarn:  { marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#fef3c7', color: '#92400e', fontSize: 13 },
  alertInfo:  { marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', fontSize: 13 },
  alertDanger:{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: 13 },
  btnPrimary: {
    padding: '9px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  btnGhost: {
    padding: '5px 10px',
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    marginLeft: 'auto',
  },
  btnSubmit: {
    width: '100%',
    padding: '12px',
    background: '#15803d',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 16,
  },
  resultGrid: { textAlign: 'left' },
};