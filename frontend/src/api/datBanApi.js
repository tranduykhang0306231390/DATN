// src/api/datBanApi.js
import axiosClient from './axiosClient';

const datBanApi = {
    // { ngay, gio, so_khach }
    khungGioTrong: (params) =>
        axiosClient.get('/member/dat-ban/khung-gio-trong', { params }),

    // { ngay, gio, so_khach, ghi_chu }
    create: (payload) => axiosClient.post('/member/dat-ban', payload),

    getAll: (params) => axiosClient.get('/member/dat-ban', { params }),
    getOne: (ma) => axiosClient.get(`/member/dat-ban/${ma}`),

    // payload: { ngan_hang, so_tai_khoan, ten_chu_tai_khoan } — chỉ bắt buộc
    // khi lượt đặt bàn còn được hoàn cọc lúc hủy.
    huy: (ma, payload = {}) => axiosClient.patch(`/member/dat-ban/${ma}/huy`, payload),

    // Dự phòng khi webhook IPN của VNPay không gọi tới được server dev cục
    // bộ — trang kết quả thanh toán gọi lại đúng endpoint xác thực chữ ký
    // này bằng chính query string VNPay trả về trình duyệt (cùng một gói
    // dữ liệu đã ký, an toàn tương đương webhook). Idempotent ở backend.
    xacNhanKetQuaVnPay: (queryString) =>
        axiosClient.get(`/thanh-toan/dat-ban/callback${queryString}`),
};

export default datBanApi;
