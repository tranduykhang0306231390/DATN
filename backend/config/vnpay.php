<?php

return [
    /*
     * Thông tin merchant lấy từ tài khoản sandbox tại
     * https://sandbox.vnpayment.vn/merchantv2 — KHÔNG commit giá trị thật,
     * chỉ khai báo qua .env.
     */
    'tmn_code' => env('VNPAY_TMN_CODE'),
    'hash_secret' => env('VNPAY_HASH_SECRET'),

    'pay_url' => env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),

    /*
     * Trang frontend khách được điều hướng về sau khi thanh toán (đọc
     * MaDatBan từ query rồi gọi lại API để lấy trạng thái thật — không tin
     * trực tiếp query param trình duyệt trả về).
     */
    'return_url' => env('VNPAY_RETURN_URL', 'http://localhost:5173/member/dat-ban/ket-qua'),
];
