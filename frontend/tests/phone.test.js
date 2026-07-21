import assert from "node:assert/strict";
import test from "node:test";

import { PHONE_STORAGE_FORMAT, toE164 } from "../src/utils/phone.js";

test("toE164 chuyển đúng số điện thoại ở định dạng lưu trữ sang E.164", () => {
    assert.equal(toE164("0356522518"), "+84356522518");
    assert.equal(toE164("0912345678"), "+84912345678");
});

test("toE164 trả về null nếu không đúng định dạng lưu trữ 0xxxxxxxxx", () => {
    assert.equal(toE164("+84356522518"), null);
    assert.equal(toE164("356522518"), null);
    assert.equal(toE164(""), null);
});

test("PHONE_STORAGE_FORMAT khớp đúng 10 chữ số bắt đầu bằng 0", () => {
    assert.equal(PHONE_STORAGE_FORMAT.test("0356522518"), true);
    assert.equal(PHONE_STORAGE_FORMAT.test("356522518"), false);
    assert.equal(PHONE_STORAGE_FORMAT.test("03565225180"), false);
});
