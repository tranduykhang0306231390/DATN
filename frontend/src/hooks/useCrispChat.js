// src/hooks/useCrispChat.js
// Nhúng động widget live chat Crisp — chỉ khi enabled=true, tự dọn sạch khi
// unmount hoặc khi enabled chuyển về false (React rules of hooks: hook luôn
// được gọi, phần bật/tắt nằm trong useEffect chứ không phải ở lời gọi hook).

import { useEffect } from "react";

import { getMemberRanks } from "../api/memberRankApi";
import { getStoredCustomerUser } from "../utils/customerSession";

const CRISP_SCRIPT_SRC = "https://client.crisp.chat/l.js";

/*
 * Crisp gắn hội thoại vào 1 session lưu qua cookie riêng của Crisp, theo
 * TRÌNH DUYỆT/THIẾT BỊ — không theo khách hàng nào đang đăng nhập trong app.
 * Vì vậy nếu khách A đăng xuất rồi khách B đăng nhập trên CÙNG trình duyệt,
 * Crisp mặc định vẫn dùng lại đúng session cũ của A -> 2 khách bị dồn chung
 * 1 đoạn hội thoại. Lưu MaKhachHang gắn với session hiện tại ở đây; nếu lần
 * mount này phát hiện khách khác với lần trước, gọi session:reset để Crisp
 * tạo hội thoại mới tinh trước khi gán lại thông tin khách hàng.
 */
const CRISP_LAST_CUSTOMER_KEY = "crisp_last_ma_khach_hang";

const getLastCrispCustomerId = () => {
    try {
        return localStorage.getItem(CRISP_LAST_CUSTOMER_KEY);
    } catch {
        return null;
    }
};

const setLastCrispCustomerId = (maKhachHang) => {
    try {
        localStorage.setItem(CRISP_LAST_CUSTOMER_KEY, String(maKhachHang));
    } catch {
        // Storage có thể bị chặn; bỏ qua — chỉ ảnh hưởng việc tách hội
        // thoại giữa các khách dùng chung trình duyệt, không ảnh hưởng chat.
    }
};

export default function useCrispChat(enabled) {
    useEffect(() => {
        if (!enabled) return undefined;

        const websiteId = import.meta.env.VITE_CRISP_WEBSITE_ID;

        if (!websiteId) {
            console.warn("useCrispChat: thiếu VITE_CRISP_WEBSITE_ID, bỏ qua nhúng Crisp.");
            return undefined;
        }

        let active = true;

        window.$crisp = [];
        window.CRISP_WEBSITE_ID = websiteId;

        const script = document.createElement("script");
        script.src = CRISP_SCRIPT_SRC;
        script.async = true;

        script.onload = () => {
            if (!active) return;

            const user = getStoredCustomerUser();
            if (!user) return;

            if (user.MaKhachHang) {
                const lastCustomerId = getLastCrispCustomerId();

                if (lastCustomerId && lastCustomerId !== String(user.MaKhachHang)) {
                    window.$crisp.push(["do", "session:reset"]);
                }

                setLastCrispCustomerId(user.MaKhachHang);
            }

            if (user.HoTen) {
                window.$crisp.push(["set", "user:nickname", [user.HoTen]]);
            }

            if (user.SoDienThoai) {
                window.$crisp.push(["set", "user:phone", [user.SoDienThoai]]);
            }

            getMemberRanks()
                .then((res) => {
                    if (!active) return;

                    const ranks = res.data?.data;
                    const currentRank = Array.isArray(ranks)
                        ? ranks.find((rank) => String(rank.MaHangThanhVien) === String(user.MaHangThanhVien))
                        : null;

                    window.$crisp.push([
                        "set",
                        "session:data",
                        [[
                            ["hang_thanh_vien", currentRank?.TenHang || ""],
                            ["ma_khach_hang", user.MaKhachHang || ""],
                        ]],
                    ]);
                })
                .catch(() => {
                    if (!active) return;

                    window.$crisp.push([
                        "set",
                        "session:data",
                        [[["ma_khach_hang", user.MaKhachHang || ""]]],
                    ]);
                });
        };

        document.head.appendChild(script);

        return () => {
            active = false;

            if (window.$crisp && typeof window.$crisp.push === "function") {
                window.$crisp.push(["do", "chat:hide"]);
            }

            script.remove();
            delete window.$crisp;
            delete window.CRISP_WEBSITE_ID;
        };
    }, [enabled]);
}
