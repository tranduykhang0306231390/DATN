import assert from "node:assert/strict";
import test from "node:test";

import {
    getAccountNavigationKey,
    getAccountSearch,
    normalizeAccountModal,
    normalizeAccountTab,
} from "../src/utils/accountCenter.js";

test("chuẩn hóa tab Account Center và không cho query lạ mount nội dung", () => {
    assert.equal(normalizeAccountTab("tickets"), "tickets");
    assert.equal(normalizeAccountTab("my-vouchers"), "my-vouchers");
    assert.equal(normalizeAccountTab("unknown"), "rank");
    assert.equal(normalizeAccountTab(null), "rank");
});

test("modal hồ sơ chỉ hợp lệ trong tab hạng và điểm", () => {
    assert.equal(normalizeAccountModal("profile", "rank"), "profile");
    assert.equal(normalizeAccountModal("password", "rank"), "password");
    assert.equal(normalizeAccountModal("profile", "vouchers"), null);
    assert.equal(normalizeAccountModal("unknown", "rank"), null);
});

test("sinh query ổn định và dùng một mục điều hướng cho toàn bộ voucher", () => {
    assert.equal(getAccountSearch({ tab: "vouchers" }), "?tab=vouchers");
    assert.equal(
        getAccountSearch({ tab: "rank", modal: "profile" }),
        "?tab=rank&modal=profile",
    );
    assert.equal(getAccountSearch({ tab: "bad", modal: "profile" }), "?tab=rank&modal=profile");
    assert.equal(getAccountNavigationKey("rank", "profile"), "rank");
    assert.equal(getAccountNavigationKey("my-vouchers", null), "vouchers");
    assert.equal(getAccountNavigationKey("transactions", null), "transactions");
});
