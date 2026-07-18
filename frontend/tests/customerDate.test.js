import assert from "node:assert/strict";
import test from "node:test";

import {
    formatCalendarDateForInput,
    formatCalendarDateVi,
    getPreviousLocalCalendarDate,
    normalizeCalendarDateForApi,
} from "../src/utils/customerDate.js";

test("định dạng ngày sinh Việt Nam mà không chuyển timezone", () => {
    assert.equal(formatCalendarDateVi("2000-01-01"), "01/01/2000");
    assert.equal(formatCalendarDateVi("2000-12-31T23:30:00.000Z"), "31/12/2000");
    assert.equal(formatCalendarDateForInput("2000-01-09 23:59:59"), "2000-01-09");
    assert.equal(normalizeCalendarDateForApi("2000-12-31"), "2000-12-31");
});

test("xử lý an toàn ngày null và ngày lịch không hợp lệ", () => {
    assert.equal(formatCalendarDateVi(null), "—");
    assert.equal(formatCalendarDateVi("2001-02-29"), "—");
    assert.equal(formatCalendarDateVi("2000-02-29"), "29/02/2000");
    assert.equal(formatCalendarDateForInput("không-phải-ngày"), "");
    assert.equal(normalizeCalendarDateForApi("2024-13-01"), "");
    assert.equal(getPreviousLocalCalendarDate(new Date(2024, 2, 1, 12, 0, 0)), "2024-02-29");
});
