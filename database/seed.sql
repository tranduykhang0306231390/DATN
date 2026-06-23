USE datn_db;

-- Xóa dữ liệu cũ theo đúng thứ tự khóa ngoại, không dùng TRUNCATE để tránh lỗi FK #1701
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM phanhoikhachhang;
DELETE FROM thongbao;
DELETE FROM lichsugiaodichdiem;
DELETE FROM chitiethoadon;
DELETE FROM hoadon;
DELETE FROM voucherkhachhang;
DELETE FROM uudai;
DELETE FROM lichsuthaydoiquytac;
DELETE FROM lichsuhangthanhvien;
DELETE FROM khachhang;
DELETE FROM hangthanhvien;
DELETE FROM quytactichdiem;
DELETE FROM loaive;
DELETE FROM nhanvien;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================
-- 1. NHANVIEN
-- =====================
INSERT INTO nhanvien (MaNhanVien, TenDangNhap, MatKhau, HoTen, VaiTro, TrangThai) VALUES
('NV001', 'admin',    '123456', 'Admin Hệ Thống',      'Admin',    'HoatDong'),
('NV002', 'thungan1', '123456', 'Nguyễn Văn An',       'NhanVien', 'HoatDong'),
('NV003', 'thungan2', '123456', 'Trần Thị Bình',       'NhanVien', 'HoatDong'),
('NV004', 'quanly1',  '123456', 'Lê Quốc Cường',       'Admin',    'HoatDong'),
('NV005', 'thungan3', '123456', 'Phạm Minh Đức',       'NhanVien', 'TamKhoa');

-- =====================
-- 2. QUYTACTICHDIEM
-- =====================
INSERT INTO quytactichdiem (MaQuyTac, SoTienQuyDoi, SoDiemNhan, NgayApDung, NgayHetHan, TrangThai) VALUES
('QT001', 10000, 1, '2026-01-01', '2026-12-31', 'HoatDong'),
('QT002',  8000, 1, '2026-01-01', '2026-12-31', 'HoatDong'),
('QT003',  5000, 1, '2026-01-01', '2026-12-31', 'HoatDong'),
('QT004', 12000, 1, '2025-01-01', '2025-12-31', 'HetHan'),
('QT005', 15000, 2, '2026-06-01', NULL,         'HoatDong');

-- =====================
-- 3. HANGTHANHVIEN
-- =====================
INSERT INTO hangthanhvien (MaHangThanhVien, TenHang, MoTa, TongChiTieuToiThieu, DiemToiThieu, ThuTuHang, MaQuyTac) VALUES
('HTV001', 'Silver',   'Hạng thành viên mới',                 0,        0,    1, 'QT001'),
('HTV002', 'Gold',     'Hạng khách hàng thân thiết',      5000000,      500,  2, 'QT002'),
('HTV003', 'VIP',      'Hạng khách hàng VIP',            20000000,     2000,  3, 'QT003'),
('HTV004', 'Diamond',  'Hạng khách hàng cao cấp',        50000000,     5000,  4, 'QT003'),
('HTV005', 'Inactive', 'Hạng ngưng áp dụng để kiểm thử', 99999999,    99999,  5, 'QT004');

-- =====================
-- 4. KHACHHANG
-- =====================
INSERT INTO khachhang (MaKhachHang, HoTen, NgaySinh, GioiTinh, NgayDangKy, Email, SoDienThoai, MatKhau, TrangThai, MaHangThanhVien, TongDiem) VALUES
('KH001', 'Nguyễn Hoàng Nam', '2001-05-12', 'Nam', '2026-06-01', 'nam.nguyen@example.com',  '0901000001', '123456', 'HoatDong', 'HTV001', 120),
('KH002', 'Trần Mỹ Linh',     '2002-08-20', 'Nu',  '2026-06-03', 'linh.tran@example.com',   '0901000002', '123456', 'HoatDong', 'HTV002', 650),
('KH003', 'Lê Quốc Huy',      '1999-11-15', 'Nam', '2026-06-05', 'huy.le@example.com',      '0901000003', '123456', 'HoatDong', 'HTV003', 2350),
('KH004', 'Phạm Gia Bảo',     '2000-02-28', 'Nam', '2026-06-07', 'bao.pham@example.com',    '0901000004', '123456', 'HoatDong', 'HTV001', 80),
('KH005', 'Võ Thảo Vy',       '2003-12-09', 'Nu',  '2026-06-09', 'vy.vo@example.com',       '0901000005', '123456', 'TamKhoa',  'HTV002', 900);

-- =====================
-- 5. LOAIVE
-- =====================
INSERT INTO loaive (MaLoaiVe, TenLoaiVe, BuoiAn, LoaiNgay, GiaVe, TrangThai) VALUES
('LV001', 'Vé buffet trưa người lớn ngày thường',  'Trua', 'NgayThuong', 249000, 'HoatDong'),
('LV002', 'Vé buffet tối người lớn ngày thường',   'Toi',  'NgayThuong', 299000, 'HoatDong'),
('LV003', 'Vé buffet trưa trẻ em ngày thường',     'Trua', 'NgayThuong', 149000, 'HoatDong'),
('LV004', 'Vé buffet tối cuối tuần người lớn',     'Toi',  'CuoiTuan',   349000, 'HoatDong'),
('LV005', 'Vé buffet trưa cuối tuần trẻ em',       'Trua', 'CuoiTuan',   199000, 'TamNgung');

-- =====================
-- 6. UUDAI
-- =====================
INSERT INTO uudai (MaUuDai, TenUuDai, SoDiemCanDoi, GiaTriGiam, MoTa, SoLuongPhatHanh, NgayBatDau, NgayKetThuc, TrangThai, MaHangThanhVien, SoLuongTon, NhomUuDai, CoTheDungChung, ThuTuApDung) VALUES
('UD001', 'Giảm 50.000đ',       100,  50000,  'Giảm trực tiếp 50.000đ trên hóa đơn', 100, '2026-06-01', '2026-12-31', 'HoatDong', 'HTV001', 95, 'GiamTien', 0, 1),
('UD002', 'Giảm 100.000đ',      200, 100000,  'Giảm trực tiếp 100.000đ trên hóa đơn', 80,  '2026-06-01', '2026-12-31', 'HoatDong', 'HTV002', 76, 'GiamTien', 0, 1),
('UD003', 'Giảm 10%',           300,  10,     'Giảm 10 phần trăm tổng hóa đơn',       60,  '2026-06-01', '2026-12-31', 'HoatDong', 'HTV002', 58, 'PhanTram', 0, 2),
('UD004', 'Tặng nước ngọt',      80,   30000, 'Tặng 1 phần nước ngọt',               120, '2026-06-01', '2026-09-30', 'HoatDong', NULL,     115,'TangMon',  1, 3),
('UD005', 'Giảm VIP 200.000đ',  400, 200000,  'Ưu đãi riêng cho khách VIP',          50,  '2026-06-01', '2026-12-31', 'HoatDong', 'HTV003', 48, 'GiamTien', 0, 1);

-- =====================
-- 7. VOUCHERKHACHHANG
-- =====================
INSERT INTO voucherkhachhang (MaVoucherKhachHang, TrangThai, MaKhachHang, MaUuDai, NgaySuDung, NgayCap, NgayHetHan) VALUES
('VKH001', 'ChuaSuDung', 'KH001', 'UD001', NULL,         '2026-06-10', '2026-07-10'),
('VKH002', 'DaSuDung',   'KH002', 'UD002', '2026-06-15', '2026-06-11', '2026-07-11'),
('VKH003', 'ChuaSuDung', 'KH003', 'UD005', NULL,         '2026-06-12', '2026-07-12'),
('VKH004', 'ChuaSuDung', 'KH004', 'UD004', NULL,         '2026-06-13', '2026-07-13'),
('VKH005', 'HetHan',     'KH005', 'UD003', NULL,         '2026-05-01', '2026-05-31');

-- =====================
-- 8. HOADON
-- =====================
INSERT INTO hoadon (MaHoaDon, NgayLap, TongTien, DiemSuDung, DiemTichLuy, TrangThai, MaNhanVien, MaKhachHang, MaQuyTacHienTai, MaHangThanhVien, MaVoucher) VALUES
('HD001', '2026-06-15 11:30:00', 498000, 0,   49, 'DaThanhToan', 'NV002', 'KH001', 'QT001', 'HTV001', NULL),
('HD002', '2026-06-15 18:45:00', 598000, 200, 74, 'DaThanhToan', 'NV003', 'KH002', 'QT002', 'HTV002', 'VKH002'),
('HD003', '2026-06-16 19:10:00', 1047000,0,  209, 'DaThanhToan', 'NV002', 'KH003', 'QT003', 'HTV003', NULL),
('HD004', '2026-06-17 12:05:00', 249000, 0,   24, 'DaThanhToan', 'NV004', 'KH004', 'QT001', 'HTV001', NULL),
('HD005', '2026-06-18 20:20:00', 698000, 0,   87, 'DaHuy',       'NV003', 'KH005', 'QT002', 'HTV002', NULL);

-- =====================
-- 9. CHITIETHOADON
-- =====================
INSERT INTO chitiethoadon (MaChiTietHD, SoLuong, DonGia, MaHoaDon, MaLoaiVe) VALUES
('CTHD001', 2, 249000, 'HD001', 'LV001'),
('CTHD002', 2, 299000, 'HD002', 'LV002'),
('CTHD003', 3, 349000, 'HD003', 'LV004'),
('CTHD004', 1, 249000, 'HD004', 'LV001'),
('CTHD005', 2, 349000, 'HD005', 'LV004');

-- =====================
-- 10. LICHSUGIAODICHDIEM
-- =====================
INSERT INTO lichsugiaodichdiem (MaGiaoDichDiem, LoaiGiaoDich, SoDiem, SoDiemTruoc, SoDiemSau, MaKhachHang, MaThamChieu, ThoiGianGiaoDich) VALUES
('GDD001', 'CongDiemHoaDon', 49,  71,  120, 'KH001', 'HD001',  '2026-06-15'),
('GDD002', 'DoiVoucher',    200, 850, 650, 'KH002', 'VKH002', '2026-06-11'),
('GDD003', 'CongDiemHoaDon',209, 2141,2350,'KH003', 'HD003',  '2026-06-16'),
('GDD004', 'CongDiemHoaDon',24,  56,  80,  'KH004', 'HD004',  '2026-06-17'),
('GDD005', 'DoiVoucher',    300, 1200,900, 'KH005', 'VKH005', '2026-05-01');

-- =====================
-- 11. THONGBAO
-- =====================
INSERT INTO thongbao (MaThongBao, TieuDe, NoiDung, ThoiGian, TrangThai, MaKhachHang) VALUES
('TB001', 'Tích điểm thành công', 'Bạn đã được cộng 49 điểm từ hóa đơn HD001.',      '2026-06-15 11:35:00', 'DaDoc',   'KH001'),
('TB002', 'Đổi voucher thành công', 'Bạn đã đổi ưu đãi Giảm 100.000đ.',             '2026-06-11 09:15:00', 'DaDoc',   'KH002'),
('TB003', 'Tích điểm thành công', 'Bạn đã được cộng 209 điểm từ hóa đơn HD003.',     '2026-06-16 19:20:00', 'ChuaDoc', 'KH003'),
('TB004', 'Ưu đãi mới', 'Nhà hàng vừa cập nhật ưu đãi Tặng nước ngọt.',              '2026-06-13 08:00:00', 'ChuaDoc', 'KH004'),
('TB005', 'Voucher hết hạn', 'Voucher VKH005 của bạn đã hết hạn.',                   '2026-06-01 08:00:00', 'ChuaDoc', 'KH005');

-- =====================
-- 12. PHANHOIKHACHHANG
-- =====================
INSERT INTO phanhoikhachhang (MaPhanHoi, DiemDanhGia, NoiDungCuaKhachHang, ThoiGian, MaKhachHang, NoiDungPhanHoiCuaHang, TrangThaiXuLy, ThoiGianPhanHoi, MaNhanVien, MaHoaDon) VALUES
('PH001', 5, 'Đồ ăn ngon, nhân viên phục vụ tốt.',        '2026-06-15 12:30:00', 'KH001', 'Cảm ơn quý khách đã đánh giá.',           'DaXuLy',  '2026-06-15 14:00:00', 'NV002', 'HD001'),
('PH002', 4, 'Không gian ổn, món lên hơi chậm.',          '2026-06-15 20:00:00', 'KH002', 'Nhà hàng sẽ cải thiện tốc độ phục vụ.',   'DaXuLy',  '2026-06-16 09:00:00', 'NV003', 'HD002'),
('PH003', 5, 'Rất hài lòng với chất lượng buffet.',       '2026-06-16 20:30:00', 'KH003', NULL,                                      'ChuaXuLy', NULL,                  NULL,    'HD003'),
('PH004', 3, 'Giá hơi cao so với phần ăn trưa.',          '2026-06-17 13:00:00', 'KH004', NULL,                                      'ChuaXuLy', NULL,                  NULL,    'HD004'),
('PH005', 2, 'Hóa đơn bị hủy nhưng thông báo chưa rõ.',   '2026-06-18 21:00:00', 'KH005', 'Nhân viên đã kiểm tra lại hóa đơn.',       'DaXuLy',  '2026-06-19 08:30:00', 'NV004', 'HD005');

-- =====================
-- 13. LICHSUTHAYDOIQUYTAC
-- =====================
INSERT INTO lichsuthaydoiquytac (MaLichSuQuyTac, MaQuyTac, SoTienQuyDoiCu, SoDiemNhanCu, SoTienQuyDoiMoi, SoDiemNhanMoi, MaNhanVien, GhiChu, ThoiGian) VALUES
('LSQT001', 'QT001', 12000, 1, 10000, 1, 'NV001', 'Cập nhật quy tắc Silver đầu năm 2026.', '2026-01-01'),
('LSQT002', 'QT002', 10000, 1, 8000,  1, 'NV001', 'Tăng ưu đãi tích điểm cho hạng Gold.', '2026-01-01'),
('LSQT003', 'QT003', 7000,  1, 5000,  1, 'NV004', 'Tăng ưu đãi tích điểm cho hạng VIP.',  '2026-01-01'),
('LSQT004', 'QT004', 10000, 1, 12000, 1, 'NV001', 'Quy tắc cũ đã hết hạn.',                '2025-12-31'),
('LSQT005', 'QT005', 10000, 1, 15000, 2, 'NV004', 'Thử nghiệm quy tắc khuyến mãi.',        '2026-06-01');

-- =====================
-- 14. LICHSUHANGTHANHVIEN
-- =====================
INSERT INTO lichsuhangthanhvien (MaLichSuHang, MaKhachHang, MaHangThanhVienCu, MaHangThanhVienMoi, ThoiGianThayDoi, LyDoThayDoi, DiemTaiThoiDiemTH, TongChiTieuTaiThoiDiem) VALUES
('LSH001', 'KH001', NULL,     'HTV001', '2026-06-01 08:00:00', 'Đăng ký thành viên mới.',            '0',    0),
('LSH002', 'KH002', 'HTV001', 'HTV002', '2026-06-10 10:00:00', 'Đủ điều kiện lên hạng Gold.',       '500',  5000000),
('LSH003', 'KH003', 'HTV002', 'HTV003', '2026-06-12 10:00:00', 'Đủ điều kiện lên hạng VIP.',        '2000', 20000000),
('LSH004', 'KH004', NULL,     'HTV001', '2026-06-07 08:00:00', 'Đăng ký thành viên mới.',            '0',    0),
('LSH005', 'KH005', 'HTV001', 'HTV002', '2026-06-09 09:30:00', 'Khách đạt điều kiện hạng Gold.',    '500',  5000000);
