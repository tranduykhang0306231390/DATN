import assert from "node:assert/strict";
import test from "node:test";
import {
    formatVoucherValue,
    getOwnedVoucherStatus,
    getStoreVoucherStatus,
    getVoucherPreviewPoints,
    getVoucherRequestError,
    normalizeVoucherPage,
} from "../src/utils/voucher.js";
import { calculateVoucherDiscount } from "../src/components/staff/staffUtils.js";

const availableVoucher = {
    MaUuDai: "UD001",
    TenUuDai: "Ưu đãi thành viên",
    SoDiemCanDoi: "200",
    GiaTriGiam: "50000",
    NhomUuDai: "GiamTien",
    SoLuongTon: "5",
    TrangThai: "HoatDong",
    NgayBatDau: "2026-07-01",
    NgayKetThuc: "2026-07-31",
    MaHangThanhVien: null,
};

const getStatus = (overrides = {}, context = {}) => getStoreVoucherStatus({
    voucher: { ...availableVoucher, ...overrides },
    currentPoints: 500,
    memberRankCode: "HTV001",
    today: "2026-07-17",
    ...context,
});

test("định dạng đúng tiền, phần trăm và quà tặng", () => {
    assert.match(formatVoucherValue(availableVoucher), /50[.\s]000\s?₫/u);
    assert.equal(
        formatVoucherValue({ ...availableVoucher, NhomUuDai: "PhanTram", GiaTriGiam: 20 }),
        "20%",
    );
    assert.equal(
        formatVoucherValue({ ...availableVoucher, NhomUuDai: "TangMon", GiaTriGiam: 0 }),
        "Tặng món",
    );
});

test("ưu tiên trạng thái khóa trước kiểm tra điểm", () => {
    assert.equal(getStatus({ TrangThai: "TamDung", SoDiemCanDoi: 9999 }).key, "inactive");
    assert.equal(getStatus({ NgayBatDau: "2026-07-18", SoDiemCanDoi: 9999 }).key, "upcoming");
    assert.equal(getStatus({ NgayKetThuc: "2026-07-16", SoDiemCanDoi: 9999 }).key, "expired");
    assert.equal(getStatus({ SoLuongTon: 0, SoDiemCanDoi: 9999 }).key, "out-of-stock");
    assert.equal(getStatus({ SoDiemCanDoi: 501 }).key, "insufficient");
    assert.equal(getStatus().key, "available");
});

test("khóa đổi khi chưa xác định được điểm hoặc hạng bắt buộc", () => {
    assert.equal(getStatus({}, { currentPoints: null }).key, "unknown-points");
    assert.equal(
        getStatus({ MaHangThanhVien: "HTV002" }, { memberRankCode: null }).key,
        "unknown-rank",
    );
    assert.equal(getStatus({ MaHangThanhVien: "HTV002" }).key, "rank-mismatch");
});

test("trạng thái đang gửi luôn chặn CTA", () => {
    const status = getStatus({}, { isSubmitting: true });
    assert.equal(status.key, "processing");
    assert.equal(status.canRedeem, false);
});

test("voucher sở hữu ưu tiên đã dùng rồi mới xét hết hạn", () => {
    assert.equal(
        getOwnedVoucherStatus(
            { TrangThai: "DaSuDung", NgayHetHan: "2026-07-01" },
            "2026-07-17",
        ).key,
        "used",
    );
    assert.equal(
        getOwnedVoucherStatus(
            { TrangThai: "ChuaSuDung", NgayHetHan: "2026-07-16" },
            "2026-07-17",
        ).key,
        "expired",
    );
    assert.equal(
        getOwnedVoucherStatus(
            { TrangThai: "ChuaSuDung", NgayHetHan: "2026-07-17" },
            "2026-07-17",
        ).key,
        "owned-available",
    );
});

test("chuẩn hóa metadata phân trang và không sinh trang âm", () => {
    assert.deepEqual(
        normalizeVoucherPage({
            data: [{ MaUuDai: "UD001" }],
            current_page: "2",
            last_page: "4",
            total: "20",
            per_page: "6",
        }),
        {
            items: [{ MaUuDai: "UD001" }],
            currentPage: 2,
            totalPages: 4,
            totalItems: 20,
            perPage: 6,
        },
    );

    const empty = normalizeVoucherPage({ current_page: 0, last_page: -2, total: -1 });
    assert.equal(empty.currentPage, 1);
    assert.equal(empty.totalPages, 0);
    assert.equal(empty.totalItems, 0);
    assert.deepEqual(empty.items, []);
});

test("điểm còn lại trong modal chỉ là preview có chặn âm", () => {
    assert.equal(getVoucherPreviewPoints(500, 200), 300);
    assert.equal(getVoucherPreviewPoints(100, 200), 0);
    assert.equal(getVoucherPreviewPoints(null, 200), null);
});

test("không đưa lỗi nội bộ của backend ra giao diện", () => {
    assert.equal(
        getVoucherRequestError({ response: { status: 500, data: { message: "SQLSTATE secret" } } }),
        "Hệ thống chưa thể đổi voucher lúc này. Vui lòng thử lại sau.",
    );
    assert.equal(
        getVoucherRequestError({ response: { status: 400, data: { message: "Voucher đã hết." } } }),
        "Voucher đã hết.",
    );
});

test("tính voucher tại quầy theo thứ tự ổn định và đúng quy tắc dùng chung", () => {
    const vouchers = [
        {
            MaVoucherKhachHang: "VKH002",
            NhomUuDai: "GiamTien",
            GiaTriGiam: 100_000,
            CoTheDungChung: false,
            ThuTuApDung: 1,
        },
        {
            MaVoucherKhachHang: "VKH001",
            NhomUuDai: "GiamTien",
            GiaTriGiam: 50_000,
            CoTheDungChung: true,
            ThuTuApDung: 1,
        },
        {
            MaVoucherKhachHang: "VKH003",
            NhomUuDai: "PhanTram",
            GiaTriGiam: 10,
            CoTheDungChung: true,
            ThuTuApDung: 2,
        },
    ];

    const input = {
        vouchers,
        selectedVoucherIds: ["VKH003", "VKH002", "VKH001"],
        subtotal: 500_000,
    };

    assert.equal(calculateVoucherDiscount(input), 100_000);
    assert.equal(calculateVoucherDiscount({ ...input, vouchers: [...vouchers].reverse() }), 100_000);
});

test("không để tổng giảm voucher làm hóa đơn âm", () => {
    assert.equal(calculateVoucherDiscount({
        vouchers: [{
            MaVoucherKhachHang: "VKH999",
            NhomUuDai: "GiamTien",
            GiaTriGiam: 999_000,
            CoTheDungChung: true,
            ThuTuApDung: 1,
        }],
        selectedVoucherIds: ["VKH999"],
        subtotal: 100_000,
    }), 100_000);
});
