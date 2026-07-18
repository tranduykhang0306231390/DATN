import assert from "node:assert/strict";
import test from "node:test";
import {
    buildMembershipState,
    formatMemberDateTime,
    getPointActivityDelta,
    sortMemberRanks,
    sortPointActivitiesNewest,
} from "../src/utils/memberRank.js";

const ranks = [
    { MaHangThanhVien: "HTV003", DiemToiThieu: "2000", ThuTuHang: "3" },
    { MaHangThanhVien: "HTV001", DiemToiThieu: "0", ThuTuHang: "1" },
    { MaHangThanhVien: "HTV002", DiemToiThieu: "500", ThuTuHang: "2" },
];

test("sắp xếp hạng theo thứ tự cấu hình và fallback ngưỡng điểm", () => {
    assert.deepEqual(
        sortMemberRanks(ranks).map((rank) => rank.MaHangThanhVien),
        ["HTV001", "HTV002", "HTV003"],
    );

    const ranksWithMissingOrder = [
        { MaHangThanhVien: "HTV002", DiemToiThieu: 500, ThuTuHang: 2 },
        { MaHangThanhVien: "HTV001", DiemToiThieu: 0, ThuTuHang: null },
    ];

    assert.deepEqual(
        sortMemberRanks(ranksWithMissingOrder).map((rank) => rank.MaHangThanhVien),
        ["HTV001", "HTV002"],
    );
});

test("tính tiến trình trong đúng khoảng giữa hai hạng", () => {
    const state = buildMembershipState(
        { TongDiem: "1000", HangThanhVien: "HTV002" },
        ranks,
    );

    assert.ok(Math.abs(state.percentage - (100 / 3)) < 0.000001);
    assert.equal(state.remainingPoints, 1000);
    assert.equal(state.currentThreshold, 500);
    assert.equal(state.nextThreshold, 2000);
});

test("giới hạn tiến trình và xử lý hạng cao nhất", () => {
    const belowCurrent = buildMembershipState(
        { TongDiem: -50, HangThanhVien: "HTV001" },
        ranks,
    );
    assert.equal(belowCurrent.currentPoints, 0);
    assert.equal(belowCurrent.percentage, 0);

    const overNext = buildMembershipState(
        { TongDiem: 900, HangThanhVien: "HTV001" },
        ranks,
    );
    assert.equal(overNext.percentage, 100);
    assert.equal(overNext.remainingPoints, 0);
    assert.equal(overNext.hasReachedNextThreshold, true);

    const exactNext = buildMembershipState(
        { TongDiem: 500, HangThanhVien: "HTV001" },
        ranks,
    );
    assert.equal(exactNext.percentage, 100);
    assert.equal(exactNext.remainingPoints, 0);

    const highest = buildMembershipState(
        { TongDiem: 99999, HangThanhVien: "HTV003" },
        ranks,
    );
    assert.equal(highest.isHighestTier, true);
    assert.equal(highest.percentage, 100);
    assert.equal(highest.remainingPoints, 0);
    assert.equal(highest.nextTier, null);
});

test("không crash với null, danh sách rỗng hoặc mã hạng không khớp", () => {
    assert.equal(
        buildMembershipState({ TongDiem: null, HangThanhVien: "HTV001" }, ranks).status,
        "no-points",
    );
    assert.equal(
        buildMembershipState({ TongDiem: 0, HangThanhVien: "HTV001" }, []).status,
        "no-config",
    );
    assert.equal(
        buildMembershipState({ TongDiem: 0, HangThanhVien: null }, ranks).status,
        "no-rank",
    );
    assert.equal(
        buildMembershipState({ TongDiem: 0, HangThanhVien: "HTV999" }, ranks).status,
        "unknown-rank",
    );
});

test("xử lý an toàn ngưỡng bằng nhau và ngưỡng bị đảo", () => {
    const equalThresholds = buildMembershipState(
        { TongDiem: 0, HangThanhVien: "A" },
        [
            { MaHangThanhVien: "A", DiemToiThieu: 0, ThuTuHang: 1 },
            { MaHangThanhVien: "B", DiemToiThieu: 0, ThuTuHang: 2 },
        ],
    );
    assert.equal(equalThresholds.hasEqualThresholds, true);
    assert.equal(equalThresholds.percentage, 100);

    const reversedThresholds = buildMembershipState(
        { TongDiem: 100, HangThanhVien: "A" },
        [
            { MaHangThanhVien: "A", DiemToiThieu: 500, ThuTuHang: 1 },
            { MaHangThanhVien: "B", DiemToiThieu: 100, ThuTuHang: 2 },
        ],
    );
    assert.equal(reversedThresholds.hasInvalidThresholdOrder, true);
    assert.equal(reversedThresholds.percentage, 100);
});

test("sắp xếp mã giao dịch theo phần số và giữ đúng dấu điểm", () => {
    assert.deepEqual(
        sortPointActivitiesNewest([
            { MaGiaoDichDiem: "GDD9" },
            { MaGiaoDichDiem: "GDD10" },
            { MaGiaoDichDiem: "GDD2" },
        ]).map((item) => item.MaGiaoDichDiem),
        ["GDD10", "GDD9", "GDD2"],
    );

    assert.equal(getPointActivityDelta({ SoDiemTruoc: 100, SoDiemSau: 160 }), 60);
    assert.equal(getPointActivityDelta({ SoDiemTruoc: 160, SoDiemSau: 40 }), -120);
    assert.equal(
        getPointActivityDelta({
            LoaiGiaoDich: "DoiVoucher",
            SoDiem: 0,
            SoDiemTruoc: 160,
            SoDiemSau: 160,
        }),
        0,
    );
});

test("định dạng ngày giờ Việt Nam mà không làm lệch timezone", () => {
    assert.equal(formatMemberDateTime("2026-07-15 19:41:13"), "15/07/2026 19:41");
    assert.equal(formatMemberDateTime("2026-07-15"), "15/07/2026");
    assert.equal(formatMemberDateTime(null), "—");
    assert.equal(formatMemberDateTime("2026-02-30 10:00:00"), "—");
    assert.equal(formatMemberDateTime("2026-07-18 25:00:00"), "—");
});
