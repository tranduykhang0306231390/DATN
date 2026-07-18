import assert from "node:assert/strict";
import test from "node:test";

import {
    getAuthRequestMessage,
    getPasswordStrength,
    getRoleHomePath,
    getRoleLoginPath,
    getSafeMemberRedirect,
    normalizeFieldErrors,
    PASSWORD_PATTERN,
} from "../src/utils/auth.js";

test("redirect theo đúng role và chỉ chấp nhận đường dẫn member an toàn", () => {
    assert.equal(getRoleHomePath("member"), "/member/rank");
    assert.equal(getRoleHomePath("NhanVien"), "/staff/dashboard");
    assert.equal(getRoleHomePath("Admin"), "/admin/dashboard");
    assert.equal(getRoleHomePath("unknown"), null);
    assert.equal(getRoleLoginPath("Admin"), "/staff/login");
    assert.equal(getRoleLoginPath("member"), "/login");
    assert.equal(getSafeMemberRedirect("/member"), "/member/rank");
    assert.equal(getSafeMemberRedirect("/member/home"), "/member/rank");
    assert.equal(getSafeMemberRedirect("/member/ticket"), "/member/rank?tab=tickets");
    assert.equal(getSafeMemberRedirect("/member/voucher"), "/member/rank?tab=vouchers");
    assert.equal(getSafeMemberRedirect("/member/invoice"), "/member/rank?tab=transactions");
    assert.equal(
        getSafeMemberRedirect("/member/rank?tab=my-vouchers#catalogue"),
        "/member/rank?tab=my-vouchers#catalogue",
    );
    assert.equal(getSafeMemberRedirect("/member/unknown"), "/member/rank");
    assert.equal(getSafeMemberRedirect("//example.com"), "/member/rank");
    assert.equal(getSafeMemberRedirect("/admin/dashboard"), "/member/rank");
});

test("không đưa lỗi nội bộ hoặc lỗi mạng thô ra form authentication", () => {
    assert.equal(
        getAuthRequestMessage({ response: { status: 500, data: { message: "SQLSTATE secret" } } }),
        "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
    );
    assert.equal(
        getAuthRequestMessage({ response: { status: 429, data: { message: "Throttle internals" } } }),
        "Bạn đã thử quá nhiều lần. Vui lòng chờ một phút rồi thử lại.",
    );
    assert.equal(
        getAuthRequestMessage({ request: {} }),
        "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.",
    );
    assert.equal(
        getAuthRequestMessage({ response: { status: 403, data: { message: "Tài khoản đã bị khóa." } } }),
        "Tài khoản đã bị khóa.",
    );
});

test("chuẩn hóa validation error theo field mà không crash với payload lạ", () => {
    assert.deepEqual(normalizeFieldErrors({ response: { data: { errors: {
        Email: ["Email không hợp lệ."],
        MatKhau: "Mật khẩu chưa đúng.",
        Empty: [],
    } } } }), {
        Email: "Email không hợp lệ.",
        MatKhau: "Mật khẩu chưa đúng.",
    });
    assert.deepEqual(normalizeFieldErrors(null), {});
});

test("quy tắc và thước đo mật khẩu tương thích backend", () => {
    assert.equal(PASSWORD_PATTERN.test("Abcdef1@"), true);
    assert.equal(PASSWORD_PATTERN.test("abcdef1@"), false);
    assert.equal(PASSWORD_PATTERN.test("Abcdefgh"), false);
    assert.equal(getPasswordStrength("abc").key, "weak");
    assert.equal(getPasswordStrength("Abcdef1@").key, "strong");
});
