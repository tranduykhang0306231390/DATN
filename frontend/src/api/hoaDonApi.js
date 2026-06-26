// src/api/hoaDonApi.js
import axiosClient from './axiosClient';

const hoaDonApi = {
  /** Lấy danh sách loại vé */
  getLoaiVe: () => axiosClient.get('/loai-ve'),

  /** Tra cứu KH + voucher theo số điện thoại */
  lookupKhachHang: (soDienThoai) =>
    axiosClient.post('/khach-hang/lookup', { so_dien_thoai: soDienThoai }),

  /** Tạo hóa đơn */
  taoHoaDon: (payload) => axiosClient.post('/hoa-don', payload),

  /** Xem chi tiết hóa đơn */
  chiTietHoaDon: (maHD) => axiosClient.get(`/hoa-don/${maHD}`),
};

export default hoaDonApi;