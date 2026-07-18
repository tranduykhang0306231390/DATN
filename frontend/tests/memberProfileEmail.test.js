import assert from "node:assert/strict";
import test from "node:test";

import {
    buildProfileEmail,
    getEmailEditorState,
    normalizeEmailEditorInput,
} from "../src/utils/memberProfileEmail.js";

test("email Gmail chỉ hiển thị local part nhưng vẫn dựng đúng payload đầy đủ", () => {
    assert.deepEqual(getEmailEditorState("  Customer.Name+vip@GMAIL.COM "), {
        mode: "gmail",
        value: "Customer.Name+vip",
    });
    assert.equal(
        buildProfileEmail({ mode: "gmail", value: " customer.name+vip " }),
        "customer.name+vip@gmail.com",
    );
});

test("paste Gmail đầy đủ không nhân đôi hậu tố và email trống mặc định dùng Gmail", () => {
    assert.deepEqual(normalizeEmailEditorInput("member@gmail.com"), {
        mode: "gmail",
        value: "member",
    });
    assert.deepEqual(getEmailEditorState(""), { mode: "gmail", value: "" });
    assert.equal(buildProfileEmail(normalizeEmailEditorInput("member@gmail.com")), "member@gmail.com");
});

test("email miền khác được giữ nguyên và không bị đổi ngầm sang Gmail", () => {
    assert.deepEqual(getEmailEditorState("member@outlook.com"), {
        mode: "full",
        value: "member@outlook.com",
    });
    assert.deepEqual(normalizeEmailEditorInput("member@yahoo.com"), {
        mode: "full",
        value: "member@yahoo.com",
    });
    assert.equal(
        buildProfileEmail({ mode: "full", value: " member@yahoo.com " }),
        "member@yahoo.com",
    );
});
