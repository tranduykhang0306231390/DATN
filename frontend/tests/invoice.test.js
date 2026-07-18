import assert from "node:assert/strict";
import test from "node:test";

import { calculateInvoiceTotals } from "../src/utils/invoice.js";

test("không trừ voucher hai lần khi TongTien đã là tổng cuối", () => {
    const totals = calculateInvoiceTotals({
        TongTien: 800_000,
        chi_tiet_hoa_don: [
            { SoLuong: 2, DonGia: 500_000 },
        ],
        vouchers_ap_dung: [
            { uu_dai: { GiaTriGiam: 200_000 } },
        ],
    });

    assert.equal(totals.subtotal, 1_000_000);
    assert.equal(totals.discount, 200_000);
    assert.equal(totals.finalTotal, 800_000);
});

test("chuẩn hóa dữ liệu hóa đơn null và không cho tổng âm", () => {
    assert.deepEqual(calculateInvoiceTotals(null), {
        details: [],
        finalTotal: 0,
        subtotal: 0,
        discount: 0,
    });

    assert.equal(calculateInvoiceTotals({ TongTien: -10 }).finalTotal, 0);
});
