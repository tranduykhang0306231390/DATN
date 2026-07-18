export const toInvoiceNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateInvoiceTotals = (invoice) => {
    const details = invoice?.chiTietHoaDon || invoice?.chi_tiet_hoa_don || [];
    const safeDetails = Array.isArray(details) ? details : [];
    const computedSubtotal = safeDetails.reduce(
        (sum, item) => sum
            + toInvoiceNumber(item?.SoLuong) * toInvoiceNumber(item?.DonGia),
        0,
    );
    const finalTotal = Math.max(0, toInvoiceNumber(invoice?.TongTien));
    const subtotal = computedSubtotal > 0 ? computedSubtotal : finalTotal;

    return {
        details: safeDetails,
        finalTotal,
        subtotal,
        discount: Math.max(0, subtotal - finalTotal),
    };
};
