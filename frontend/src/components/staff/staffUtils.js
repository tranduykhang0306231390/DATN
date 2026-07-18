export const fmt = (value) =>
    Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export const fmtDate = (value) =>
    value ? new Date(value).toLocaleString('vi-VN') : '—';

export const TRANG_THAI_CONFIG = {
    DaThanhToan: { badgeClass: 'badge badge-success', label: 'Đã thanh toán' },
    DaHuy: { badgeClass: 'badge badge-danger', label: 'Đã hủy' },
};

export const BUOI_LABEL = { Trua: '🌤 Trưa', Toi: '🌙 Tối' };
export const NGAY_LABEL = { NgayThuong: 'Ngày thường', CuoiTuan: 'Cuối tuần' };
export const NHOM_LABEL = { GiamTien: 'Giảm tiền', PhanTram: 'Giảm %', TangMon: 'Tặng món' };

export const calculateVoucherDiscount = ({ vouchers, selectedVoucherIds, subtotal }) => {
    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const selectedIds = new Set(Array.isArray(selectedVoucherIds) ? selectedVoucherIds : []);
    const groupShareability = new Map();
    let discount = 0;

    const selectedVouchers = (Array.isArray(vouchers) ? [...vouchers] : [])
        .filter((voucher) => selectedIds.has(voucher.MaVoucherKhachHang))
        .sort((left, right) => {
            const orderDifference = (Number(left.ThuTuApDung) || 0) - (Number(right.ThuTuApDung) || 0);
            if (orderDifference !== 0) return orderDifference;
            return String(left.MaVoucherKhachHang).localeCompare(String(right.MaVoucherKhachHang));
        });

    for (const voucher of selectedVouchers) {
        if (discount >= safeSubtotal) break;

        const group = voucher.NhomUuDai;
        const isShareable = [true, 1, '1'].includes(voucher.CoTheDungChung);
        if (
            groupShareability.has(group)
            && (!groupShareability.get(group) || !isShareable)
        ) {
            continue;
        }

        const value = Number(voucher.GiaTriGiam) || 0;
        let voucherDiscount = group === 'PhanTram'
            ? safeSubtotal * (value / 100)
            : value;

        voucherDiscount = Math.min(voucherDiscount, safeSubtotal - discount);
        if (voucherDiscount <= 0) continue;

        discount += voucherDiscount;
        groupShareability.set(group, (groupShareability.get(group) ?? true) && isShareable);
    }

    return Math.min(discount, safeSubtotal);
};
