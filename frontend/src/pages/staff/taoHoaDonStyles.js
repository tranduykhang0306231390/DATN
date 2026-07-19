

/* ── Chú thích màu ở sơ đồ bàn ── */
export function dot(bg, bd) {
    return {
        display: 'inline-block', width: 12, height: 12, borderRadius: 3,
        background: bg, border: `1px solid ${bd}`, verticalAlign: 'middle', marginRight: 4,
    };
}

/* ── Modal thanh toán ── */
export const ovl = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20, boxSizing: 'border-box',
};

export const box = {
    background: '#fff', borderRadius: 16,
    width: '100%', maxWidth: 560,
    maxHeight: 'calc(100vh - 40px)',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,.25)',
    overflow: 'hidden', textAlign: 'left', boxSizing: 'border-box',
};

export const mHead = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0,
};

export const mBody = { padding: '20px 24px', overflowY: 'auto', flex: 1 };

export const mFoot = {
    padding: '14px 24px', borderTop: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
};

export const mClose = {
    background: 'none', border: 'none', fontSize: 18,
    cursor: 'pointer', color: '#9ca3af', lineHeight: 1, padding: 0,
};

/* ── Khối tổng kết tiền ── */
export const sumBox = { background: '#f9fafb', borderRadius: 10, padding: '14px 16px', marginTop: 16 };
export const sumRow = { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#374151', padding: '6px 0' };

/* ── Khung điểm tích lũy dự kiến ── */
export const pointBox = {
    marginTop: 12, padding: '10px 14px', borderRadius: 8,
    background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 14,
};
export const pointBoxGray = {
    marginTop: 12, padding: '10px 14px', borderRadius: 8,
    background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 13,
};

/* ── Nút trong modal-footer ── */
export const btnClose = {
    padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: 8,
    background: '#fff', color: '#111827', cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
export const btnPay = {
    padding: '8px 20px', background: '#15803d', color: '#fff', border: 'none',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
};

/* ── Nút chiếm trọn chiều ngang trong panel phải ── */
export const btnFull = { width: '100%', marginTop: 0, marginLeft: 0, marginBottom: 8, boxSizing: 'border-box' };

/* ── Lưới 2x2 cho 4 nút thao tác bàn ── */
export const btnGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 };

/* Chuẩn hóa kích thước nút trong lưới — khử padding/margin/font riêng của
   từng class (.btn-primary, .btn-outline, .btn-danger, .btn-success). */
export const btnCell = {
    width: '100%',
    margin: 0,
    padding: '11px 6px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
};

/* ── Khung nhắc ở danh sách voucher ── */
export const noteDuVoucher = {
    marginTop: 4, padding: '9px 12px', borderRadius: 8,
    background: '#fffbeb', border: '1px solid #fde68a',
    color: '#92400e', fontSize: 12.5, lineHeight: 1.5,
};