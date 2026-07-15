-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th7 15, 2026 lúc 04:45 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `db_test_1`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `banner`
--

CREATE TABLE `banner` (
  `MaBanner` varchar(255) NOT NULL,
  `TieuDe` varchar(255) NOT NULL,
  `HinhAnh` varchar(255) NOT NULL,
  `Link` varchar(255) DEFAULT NULL,
  `ThuTu` int(11) NOT NULL DEFAULT 1,
  `TrangThai` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `banner`
--

INSERT INTO `banner` (`MaBanner`, `TieuDe`, `HinhAnh`, `Link`, `ThuTu`, `TrangThai`) VALUES
('BN001', 'Buffet Hải Sản', 'banner1.jpg', '/banner/banner1.jpg', 1, 1),
('BN002', 'Buffet BBQ', 'banner2.jpg', '/banner/banner2.jpg', 2, 1),
('BN003', 'Buffet Nhật', 'banner3.jpg', '/banner/banner3.jpg', 3, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chitiethoadon`
--

CREATE TABLE `chitiethoadon` (
  `MaChiTietHD` varchar(20) NOT NULL,
  `SoLuong` int(11) NOT NULL,
  `DonGia` decimal(18,2) NOT NULL,
  `MaHoaDon` varchar(20) NOT NULL,
  `MaLoaiVe` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `chitiethoadon`
--

INSERT INTO `chitiethoadon` (`MaChiTietHD`, `SoLuong`, `DonGia`, `MaHoaDon`, `MaLoaiVe`) VALUES
('CTHD001', 2, 249000.00, 'HD001', 'LV001'),
('CTHD002', 2, 149000.00, 'HD001', 'LV003'),
('CTHD003', 3, 249000.00, 'HD002', 'LV001'),
('CTHD004', 4, 149000.00, 'HD002', 'LV003'),
('CTHD005', 3, 249000.00, 'HD003', 'LV001'),
('CTHD006', 3, 149000.00, 'HD003', 'LV003'),
('CTHD007', 6, 249000.00, 'HD004', 'LV001'),
('CTHD008', 5, 149000.00, 'HD004', 'LV003'),
('CTHD009', 2, 249000.00, 'HD005', 'LV001'),
('CTHD010', 1, 149000.00, 'HD005', 'LV003'),
('CTHD011', 2, 249000.00, 'HD006', 'LV001'),
('CTHD012', 2, 149000.00, 'HD006', 'LV003'),
('CTHD013', 15, 299000.00, 'HD007', 'LV002'),
('CTHD014', 5, 299000.00, 'HD008', 'LV002'),
('CTHD015', 62, 299000.00, 'HD009', 'LV002'),
('CTHD016', 5, 299000.00, 'HD010', 'LV002'),
('CTHD017', 18, 299000.00, 'HD011', 'LV002'),
('CTHD018', 3, 299000.00, 'HD012', 'LV002');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hangthanhvien`
--

CREATE TABLE `hangthanhvien` (
  `MaHangThanhVien` varchar(20) NOT NULL,
  `TenHang` varchar(50) NOT NULL,
  `MoTa` varchar(255) DEFAULT NULL,
  `TongChiTieuToiThieu` decimal(18,2) NOT NULL DEFAULT 0.00,
  `DiemToiThieu` int(11) NOT NULL DEFAULT 0,
  `ThuTuHang` int(11) NOT NULL,
  `MaQuyTac` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `hangthanhvien`
--

INSERT INTO `hangthanhvien` (`MaHangThanhVien`, `TenHang`, `MoTa`, `TongChiTieuToiThieu`, `DiemToiThieu`, `ThuTuHang`, `MaQuyTac`) VALUES
('HTV001', 'Đồng', 'Hạng thành viên mới', 0.00, 0, 1, 'QT001'),
('HTV002', 'Bạc', 'Hạng khách hàng thân thiết', 5000000.00, 500, 2, 'QT002'),
('HTV003', 'Vàng', 'Hạng khách hàng VIP', 20000000.00, 2000, 3, 'QT003'),
('HTV004', 'Kim cương', 'Hạng khách hàng cao cấp', 50000000.00, 5000, 4, 'QT005');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hoadon`
--

CREATE TABLE `hoadon` (
  `MaHoaDon` varchar(20) NOT NULL,
  `NgayLap` datetime NOT NULL DEFAULT current_timestamp(),
  `TongTien` decimal(18,2) NOT NULL DEFAULT 0.00,
  `DiemSuDung` int(11) NOT NULL DEFAULT 0,
  `DiemTichLuy` int(11) NOT NULL DEFAULT 0,
  `TrangThai` varchar(20) NOT NULL DEFAULT 'DaThanhToan',
  `MaNhanVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaKhachHang` varchar(20) DEFAULT NULL,
  `MaQuyTacHienTai` varchar(20) DEFAULT NULL,
  `MaHangThanhVien` varchar(20) DEFAULT NULL,
  `MaVoucher` varchar(255) DEFAULT NULL,
  `SoBan` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `hoadon`
--

INSERT INTO `hoadon` (`MaHoaDon`, `NgayLap`, `TongTien`, `DiemSuDung`, `DiemTichLuy`, `TrangThai`, `MaNhanVien`, `MaKhachHang`, `MaQuyTacHienTai`, `MaHangThanhVien`, `MaVoucher`, `SoBan`) VALUES
('HD001', '2026-07-15 11:52:31', 796000.00, 0, 94, 'DaThanhToan', 'NV002', 'KH001', 'QT001', 'HTV001', NULL, '1'),
('HD002', '2026-07-15 11:54:14', 1343000.00, 0, 0, 'DaThanhToan', 'NV002', NULL, NULL, NULL, NULL, '2'),
('HD003', '2026-07-15 11:54:34', 1194000.00, 0, 142, 'DaThanhToan', 'NV002', 'KH001', 'QT001', 'HTV001', NULL, '3'),
('HD004', '2026-07-15 11:55:22', 2239000.00, 0, 267, 'DaThanhToan', 'NV002', 'KH001', 'QT001', 'HTV001', NULL, '10'),
('HD005', '2026-07-15 11:55:26', 647000.00, 0, 112, 'DaThanhToan', 'NV002', 'KH001', 'QT002', 'HTV001', NULL, '15'),
('HD006', '2026-07-15 11:55:19', 796000.00, 0, 0, 'DaThanhToan', 'NV002', NULL, NULL, NULL, NULL, '17'),
('HD007', '2026-07-15 19:41:13', 4485000.00, 0, 537, 'DaThanhToan', 'NV002', 'KH002', 'QT001', 'HTV001', NULL, '1'),
('HD008', '2026-07-15 19:41:16', 1495000.00, 0, 178, 'DaThanhToan', 'NV002', 'KH003', 'QT001', 'HTV001', NULL, '2'),
('HD009', '2026-07-15 19:41:19', 18538000.00, 0, 2223, 'DaThanhToan', 'NV002', 'KH004', 'QT001', 'HTV001', NULL, '3'),
('HD010', '2026-07-15 19:41:22', 1215500.00, 0, 211, 'DaThanhToan', 'NV002', 'KH001', 'QT002', 'HTV002', 'VKH001,VKH002,VKH003', '4'),
('HD011', '2026-07-15 19:43:12', 5382000.00, 0, 645, 'DaThanhToan', 'NV002', 'KH005', 'QT001', 'HTV001', NULL, '5'),
('HD012', '2026-07-15 19:43:15', 897000.00, 0, 106, 'DaThanhToan', 'NV002', 'KH006', 'QT001', 'HTV001', NULL, '6');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `khachhang`
--

CREATE TABLE `khachhang` (
  `MaKhachHang` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` varchar(10) DEFAULT NULL,
  `NgayDangKy` date NOT NULL DEFAULT curdate(),
  `Email` varchar(100) DEFAULT NULL,
  `SoDienThoai` varchar(15) NOT NULL,
  `MatKhau` varchar(255) NOT NULL,
  `TrangThai` varchar(20) NOT NULL DEFAULT 'HoatDong',
  `MaHangThanhVien` varchar(20) NOT NULL,
  `TongDiem` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `khachhang`
--

INSERT INTO `khachhang` (`MaKhachHang`, `HoTen`, `NgaySinh`, `GioiTinh`, `NgayDangKy`, `Email`, `SoDienThoai`, `MatKhau`, `TrangThai`, `MaHangThanhVien`, `TongDiem`) VALUES
('KH001', 'Trần Duy Khang', '2005-05-06', 'Nam', '2026-07-15', 'khang@gmail.com', '0356522518', '$2y$12$ziN2GUiuL4wrlikhQMjEz.s2CTgpvSDCX56dcTjsXuaGUMOjtYPxS', 'HoatDong', 'HTV002', 246),
('KH002', 'Nguyễn Hoàng Nam', '2005-02-10', 'Nam', '2026-07-15', 'nam@gmail.com', '0356522511', '$2y$12$fjJv4WvxKv9GCmhNFtUfHeHZRWtPLT9KhCFibncNVpjgyFJN9ekqe', 'HoatDong', 'HTV002', 537),
('KH003', 'Lê Văn Thanh', '2009-07-09', 'Nam', '2026-07-15', 'thanh@gmail.com', '0356522512', '$2y$12$rlhNNVkfB41eaa9JP5Rw0uv2Ha0ukgmN71OPtAxCg1.aeANb5T5g.', 'HoatDong', 'HTV001', 178),
('KH004', 'Hồ Hoàng Ngọc Yến', '2006-06-15', 'Nu', '2026-07-15', 'yen@gmail.com', '0356522513', '$2y$12$Tkzz78ebkWVRBDGJZWzd1OMlEXhqy.r0EQSy7cQb5yqSMjoEjrKTq', 'HoatDong', 'HTV003', 2223),
('KH005', 'Khôi Nguyên', '2004-02-11', 'Nam', '2026-07-15', 'nguyen@gmail.com', '0356522514', '$2y$12$0dTcSZ1yjam9ypUboskMWOlXXqSYeJNyU/838bKJTVOrsAJDnRBg6', 'HoatDong', 'HTV002', 645),
('KH006', 'Bùi Du Mục', '2003-06-10', 'Nam', '2026-07-15', 'muc@gmail.com', '0356522515', '$2y$12$2kw9xNN69EwlSuybXPEofecVuGJ7/xLDzu8BgTv9W0TL6YsEXgIPG', 'HoatDong', 'HTV001', 106);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lichsugiaodichdiem`
--

CREATE TABLE `lichsugiaodichdiem` (
  `MaGiaoDichDiem` varchar(20) NOT NULL,
  `LoaiGiaoDich` varchar(50) NOT NULL,
  `SoDiem` int(11) NOT NULL,
  `SoDiemTruoc` int(11) NOT NULL,
  `SoDiemSau` int(11) NOT NULL,
  `MaKhachHang` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaThamChieu` varchar(20) DEFAULT NULL,
  `ThoiGianGiaoDich` date NOT NULL DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `lichsugiaodichdiem`
--

INSERT INTO `lichsugiaodichdiem` (`MaGiaoDichDiem`, `LoaiGiaoDich`, `SoDiem`, `SoDiemTruoc`, `SoDiemSau`, `MaKhachHang`, `MaThamChieu`, `ThoiGianGiaoDich`) VALUES
('GDD001', 'CongDiemHoaDon', 94, 0, 94, 'KH001', 'HD001', '2026-07-15'),
('GDD002', 'CongDiemHoaDon', 142, 94, 236, 'KH001', 'HD003', '2026-07-15'),
('GDD003', 'CongDiemHoaDon', 267, 236, 503, 'KH001', 'HD004', '2026-07-15'),
('GDD004', 'CongDiemHoaDon', 112, 503, 615, 'KH001', 'HD005', '2026-07-15'),
('GDD005', 'DoiVoucher', 200, 615, 415, 'KH001', 'VKH001', '2026-07-15'),
('GDD006', 'DoiVoucher', 300, 415, 115, 'KH001', 'VKH002', '2026-07-15'),
('GDD007', 'DoiVoucher', 80, 115, 35, 'KH001', 'VKH003', '2026-07-15'),
('GDD008', 'CongDiemHoaDon', 537, 0, 537, 'KH002', 'HD007', '2026-07-15'),
('GDD009', 'CongDiemHoaDon', 178, 0, 178, 'KH003', 'HD008', '2026-07-15'),
('GDD010', 'CongDiemHoaDon', 2223, 0, 2223, 'KH004', 'HD009', '2026-07-15'),
('GDD011', 'CongDiemHoaDon', 211, 35, 246, 'KH001', 'HD010', '2026-07-15'),
('GDD012', 'CongDiemHoaDon', 645, 0, 645, 'KH005', 'HD011', '2026-07-15'),
('GDD013', 'CongDiemHoaDon', 106, 0, 106, 'KH006', 'HD012', '2026-07-15');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lichsuhangthanhvien`
--

CREATE TABLE `lichsuhangthanhvien` (
  `MaLichSuHang` varchar(20) NOT NULL,
  `MaKhachHang` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaHangThanhVienCu` varchar(20) DEFAULT NULL,
  `MaHangThanhVienMoi` varchar(20) NOT NULL,
  `ThoiGianThayDoi` datetime NOT NULL DEFAULT current_timestamp(),
  `LyDoThayDoi` varchar(255) DEFAULT NULL,
  `DiemTaiThoiDiemTH` varchar(20) DEFAULT NULL,
  `TongChiTieuTaiThoiDiem` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `lichsuhangthanhvien`
--

INSERT INTO `lichsuhangthanhvien` (`MaLichSuHang`, `MaKhachHang`, `MaHangThanhVienCu`, `MaHangThanhVienMoi`, `ThoiGianThayDoi`, `LyDoThayDoi`, `DiemTaiThoiDiemTH`, `TongChiTieuTaiThoiDiem`) VALUES
('LSH001', 'KH001', 'HTV001', 'HTV002', '2026-07-15 11:55:22', 'Đủ điều kiện lên hạng Bạc', '503', 4229000.00),
('LSH002', 'KH002', 'HTV001', 'HTV002', '2026-07-15 19:41:13', 'Đủ điều kiện lên hạng Bạc', '537', 4485000.00),
('LSH003', 'KH004', 'HTV001', 'HTV003', '2026-07-15 19:41:19', 'Đủ điều kiện lên hạng Vàng', '2223', 18538000.00),
('LSH004', 'KH005', 'HTV001', 'HTV002', '2026-07-15 19:43:12', 'Đủ điều kiện lên hạng Bạc', '645', 5382000.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lichsuthaydoiquytac`
--

CREATE TABLE `lichsuthaydoiquytac` (
  `MaLichSuQuyTac` varchar(20) NOT NULL,
  `MaQuyTac` varchar(20) NOT NULL,
  `SoTienQuyDoiCu` decimal(18,2) NOT NULL,
  `SoDiemNhanCu` int(11) NOT NULL,
  `SoTienQuyDoiMoi` decimal(18,2) NOT NULL,
  `SoDiemNhanMoi` int(11) NOT NULL,
  `MaNhanVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `GhiChu` varchar(255) DEFAULT NULL,
  `ThoiGian` date NOT NULL DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `loaive`
--

CREATE TABLE `loaive` (
  `MaLoaiVe` varchar(20) NOT NULL,
  `TenLoaiVe` varchar(100) NOT NULL,
  `BuoiAn` varchar(50) NOT NULL,
  `LoaiNgay` varchar(50) NOT NULL,
  `GiaVe` decimal(18,2) NOT NULL,
  `TrangThai` varchar(20) NOT NULL DEFAULT 'HoatDong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `loaive`
--

INSERT INTO `loaive` (`MaLoaiVe`, `TenLoaiVe`, `BuoiAn`, `LoaiNgay`, `GiaVe`, `TrangThai`) VALUES
('LV001', 'Vé buffet trưa người lớn ngày thường', 'Trua', 'NgayThuong', 249000.00, 'HoatDong'),
('LV002', 'Vé buffet tối người lớn ngày thường', 'Toi', 'NgayThuong', 299000.00, 'HoatDong'),
('LV003', 'Vé buffet trưa trẻ em ngày thường', 'Trua', 'NgayThuong', 149000.00, 'HoatDong'),
('LV004', 'Vé buffet tối cuối tuần người lớn', 'Toi', 'CuoiTuan', 349000.00, 'HoatDong'),
('LV005', 'Vé buffet trưa cuối tuần trẻ em', 'Trua', 'CuoiTuan', 199000.00, 'TamNgung');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_07_11_124534_add_soban_to_hoadon', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `nhanvien`
--

CREATE TABLE `nhanvien` (
  `MaNhanVien` varchar(20) NOT NULL,
  `TenDangNhap` varchar(50) NOT NULL,
  `MatKhau` varchar(255) NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `VaiTro` varchar(50) NOT NULL,
  `TrangThai` varchar(20) NOT NULL DEFAULT 'HoatDong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `nhanvien`
--

INSERT INTO `nhanvien` (`MaNhanVien`, `TenDangNhap`, `MatKhau`, `HoTen`, `VaiTro`, `TrangThai`) VALUES
('NV001', 'admin', '$2y$12$HFZ9tja4nZ.bIq9QZyf9BeqjRrXi2lE4qmpr2qEKdIulg1qnmLzyq', 'Admin Hệ Thống', 'Admin', 'HoatDong'),
('NV002', 'thungan1', '$2y$12$/AP0SWrjbXxu5tc4/PcE2e0lbaOTi6f/marHdnz9r1nStFInMce3y', 'Nguyễn Văn An', 'NhanVien', 'HoatDong'),
('NV003', 'thungan2', '$2y$12$ZTcUPAfL9lY7zt0.AAApb.XN.LxWeSKQBsscXjaaVI8NDFwnd5Jri', 'Trần Thị Bình', 'NhanVien', 'HoatDong'),
('NV004', 'quanly1', '$2y$12$k15F6XmSWkg7PXAZrm..3.6F0ty.7Mu9vSs9scsijxZGUKCjhHPfu', 'Lê Quốc Cường', 'Admin', 'HoatDong'),
('NV005', 'thungan3', '$2y$12$Utke7N/ueuB3Q2vZ.WnCOeezB7jTOm9JPVvwKTWZSosp.GnK7ffG6', 'Phạm Minh Đức', 'NhanVien', 'TamKhoa');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `phanhoikhachhang`
--

CREATE TABLE `phanhoikhachhang` (
  `MaPhanHoi` varchar(20) NOT NULL,
  `DiemDanhGia` int(11) NOT NULL,
  `NoiDungCuaKhachHang` varchar(500) NOT NULL,
  `ThoiGian` datetime NOT NULL DEFAULT current_timestamp(),
  `MaKhachHang` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NoiDungPhanHoiCuaHang` varchar(500) DEFAULT NULL,
  `TrangThaiXuLy` varchar(20) NOT NULL DEFAULT 'ChuaXuLy',
  `ThoiGianPhanHoi` datetime DEFAULT NULL,
  `MaNhanVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaHoaDon` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `phanhoikhachhang`
--

INSERT INTO `phanhoikhachhang` (`MaPhanHoi`, `DiemDanhGia`, `NoiDungCuaKhachHang`, `ThoiGian`, `MaKhachHang`, `NoiDungPhanHoiCuaHang`, `TrangThaiXuLy`, `ThoiGianPhanHoi`, `MaNhanVien`, `MaHoaDon`) VALUES
('PH001', 5, 'Đồ ăn ngon, phục vụ nhiệt tình', '2026-07-15 19:46:42', 'KH006', 'Cảm ơn bạn đã ủng hộ nhà hàng !', 'DaXuLy', '2026-07-15 21:43:01', 'NV001', 'HD012');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `quytactichdiem`
--

CREATE TABLE `quytactichdiem` (
  `MaQuyTac` varchar(20) NOT NULL,
  `SoTienQuyDoi` decimal(18,2) NOT NULL,
  `SoDiemNhan` int(11) NOT NULL,
  `NgayApDung` date NOT NULL,
  `NgayHetHan` date DEFAULT NULL,
  `TrangThai` varchar(20) NOT NULL DEFAULT 'HoatDong',
  `GiaTriHoaDonToiThieu` decimal(12,2) NOT NULL DEFAULT 0.00,
  `HeSoNhanDiem` decimal(3,2) NOT NULL DEFAULT 1.00,
  `NhanDoiSinhNhat` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `quytactichdiem`
--

INSERT INTO `quytactichdiem` (`MaQuyTac`, `SoTienQuyDoi`, `SoDiemNhan`, `NgayApDung`, `NgayHetHan`, `TrangThai`, `GiaTriHoaDonToiThieu`, `HeSoNhanDiem`, `NhanDoiSinhNhat`) VALUES
('QT001', 10000.00, 1, '2026-01-01', '2026-12-31', 'HoatDong', 300000.00, 1.20, 0),
('QT002', 8000.00, 1, '2026-01-01', '2026-12-31', 'HoatDong', 600000.00, 1.40, 0),
('QT003', 5000.00, 1, '2026-01-01', '2026-12-31', 'HoatDong', 900000.00, 1.60, 0),
('QT004', 12000.00, 1, '2025-01-01', '2025-12-31', 'HetHan', 1200000.00, 2.00, 0),
('QT005', 15000.00, 2, '2026-06-01', NULL, 'HoatDong', 0.00, 1.00, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `thongbao`
--

CREATE TABLE `thongbao` (
  `MaThongBao` varchar(20) NOT NULL,
  `TieuDe` varchar(255) NOT NULL,
  `NoiDung` varchar(500) NOT NULL,
  `ThoiGian` datetime NOT NULL DEFAULT current_timestamp(),
  `TrangThai` varchar(20) NOT NULL DEFAULT 'ChuaDoc',
  `MaKhachHang` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `thongbao`
--

INSERT INTO `thongbao` (`MaThongBao`, `TieuDe`, `NoiDung`, `ThoiGian`, `TrangThai`, `MaKhachHang`) VALUES
('TB001', 'Tích điểm thành công', 'Bạn đã được cộng 94 điểm từ hóa đơn HD001.', '2026-07-15 11:52:31', 'DaDoc', 'KH001'),
('TB002', 'Tích điểm thành công', 'Bạn đã được cộng 142 điểm từ hóa đơn HD003.', '2026-07-15 11:54:34', 'DaDoc', 'KH001'),
('TB003', 'Tích điểm thành công', 'Bạn đã được cộng 267 điểm từ hóa đơn HD004.', '2026-07-15 11:55:22', 'DaDoc', 'KH001'),
('TB004', 'Chúc mừng! Bạn đã lên hạng Bạc', 'Tài khoản của bạn đã được nâng lên hạng Bạc. Chúc mừng!', '2026-07-15 11:55:22', 'DaDoc', 'KH001'),
('TB005', 'Tích điểm thành công', 'Bạn đã được cộng 112 điểm từ hóa đơn HD005.', '2026-07-15 11:55:26', 'DaDoc', 'KH001'),
('TB006', 'Tích điểm thành công', 'Bạn đã được cộng 537 điểm từ hóa đơn HD007.', '2026-07-15 19:41:13', 'ChuaDoc', 'KH002'),
('TB007', 'Chúc mừng! Bạn đã lên hạng Bạc', 'Tài khoản của bạn đã được nâng lên hạng Bạc. Chúc mừng!', '2026-07-15 19:41:13', 'ChuaDoc', 'KH002'),
('TB008', 'Tích điểm thành công', 'Bạn đã được cộng 178 điểm từ hóa đơn HD008.', '2026-07-15 19:41:16', 'ChuaDoc', 'KH003'),
('TB009', 'Tích điểm thành công', 'Bạn đã được cộng 2223 điểm từ hóa đơn HD009.', '2026-07-15 19:41:19', 'ChuaDoc', 'KH004'),
('TB010', 'Chúc mừng! Bạn đã lên hạng Vàng', 'Tài khoản của bạn đã được nâng lên hạng Vàng. Chúc mừng!', '2026-07-15 19:41:19', 'ChuaDoc', 'KH004'),
('TB011', 'Tích điểm thành công', 'Bạn đã được cộng 211 điểm từ hóa đơn HD010.', '2026-07-15 19:41:22', 'ChuaDoc', 'KH001'),
('TB012', 'Tích điểm thành công', 'Bạn đã được cộng 645 điểm từ hóa đơn HD011.', '2026-07-15 19:43:12', 'ChuaDoc', 'KH005'),
('TB013', 'Chúc mừng! Bạn đã lên hạng Bạc', 'Tài khoản của bạn đã được nâng lên hạng Bạc. Chúc mừng!', '2026-07-15 19:43:12', 'ChuaDoc', 'KH005'),
('TB014', 'Tích điểm thành công', 'Bạn đã được cộng 106 điểm từ hóa đơn HD012.', '2026-07-15 19:43:15', 'DaDoc', 'KH006'),
('TB015', 'Phản hồi của bạn đã được hồi đáp', 'Nhà hàng đã phản hồi đánh giá của bạn cho hóa đơn HD012. Nhấn để xem chi tiết.', '2026-07-15 21:43:01', 'ChuaDoc', 'KH006');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `uudai`
--

CREATE TABLE `uudai` (
  `MaUuDai` varchar(20) NOT NULL,
  `TenUuDai` varchar(100) NOT NULL,
  `SoDiemCanDoi` int(11) NOT NULL,
  `GiaTriGiam` decimal(18,2) NOT NULL DEFAULT 0.00,
  `MoTa` varchar(255) DEFAULT NULL,
  `SoLuongPhatHanh` int(11) NOT NULL DEFAULT 0,
  `NgayBatDau` date NOT NULL,
  `NgayKetThuc` date NOT NULL,
  `TrangThai` varchar(20) NOT NULL DEFAULT 'HoatDong',
  `MaHangThanhVien` varchar(20) DEFAULT NULL,
  `SoLuongTon` int(11) NOT NULL DEFAULT 0,
  `NhomUuDai` varchar(255) DEFAULT NULL,
  `CoTheDungChung` tinyint(1) NOT NULL DEFAULT 0,
  `ThuTuApDung` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `uudai`
--

INSERT INTO `uudai` (`MaUuDai`, `TenUuDai`, `SoDiemCanDoi`, `GiaTriGiam`, `MoTa`, `SoLuongPhatHanh`, `NgayBatDau`, `NgayKetThuc`, `TrangThai`, `MaHangThanhVien`, `SoLuongTon`, `NhomUuDai`, `CoTheDungChung`, `ThuTuApDung`) VALUES
('UD001', 'Giảm 50.000đ', 100, 50000.00, 'Giảm trực tiếp 50.000đ trên hóa đơn', 100, '2026-06-01', '2026-12-31', 'HoatDong', 'HTV001', 95, 'GiamTien', 0, 1),
('UD002', 'Giảm 100.000đ', 200, 100000.00, 'Giảm trực tiếp 100.000đ trên hóa đơn', 80, '2026-06-01', '2026-12-31', 'HoatDong', 'HTV002', 74, 'GiamTien', 0, 1),
('UD003', 'Giảm 10%', 300, 10.00, 'Giảm 10 phần trăm tổng hóa đơn', 60, '2026-06-01', '2026-12-31', 'HoatDong', 'HTV002', 57, 'PhanTram', 0, 1),
('UD004', 'Tặng nước ngọt', 80, 30000.00, 'Tặng 1 phần nước ngọt', 120, '2026-06-01', '2026-09-30', 'HoatDong', NULL, 101, 'TangMon', 1, 1),
('UD005', 'Giảm VIP 200.000đ', 400, 200000.00, 'Ưu đãi riêng cho khách VIP', 50, '2026-06-01', '2026-12-31', 'HoatDong', 'HTV003', 48, 'GiamTien', 0, 1),
('UD006', 'Giảm 5%', 500, 5.00, NULL, 13, '2026-07-17', '2026-07-24', 'HoatDong', NULL, 13, 'PhanTram', 1, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `voucherkhachhang`
--

CREATE TABLE `voucherkhachhang` (
  `MaVoucherKhachHang` varchar(20) NOT NULL,
  `TrangThai` varchar(20) NOT NULL DEFAULT 'ChuaSuDung',
  `MaKhachHang` varchar(20) NOT NULL,
  `MaUuDai` varchar(20) NOT NULL,
  `NgaySuDung` date DEFAULT NULL,
  `NgayCap` date NOT NULL DEFAULT curdate(),
  `NgayHetHan` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `voucherkhachhang`
--

INSERT INTO `voucherkhachhang` (`MaVoucherKhachHang`, `TrangThai`, `MaKhachHang`, `MaUuDai`, `NgaySuDung`, `NgayCap`, `NgayHetHan`) VALUES
('VKH001', 'DaSuDung', 'KH001', 'UD002', '2026-07-15', '2026-07-15', '2026-12-31'),
('VKH002', 'DaSuDung', 'KH001', 'UD003', '2026-07-15', '2026-07-15', '2026-12-31'),
('VKH003', 'DaSuDung', 'KH001', 'UD004', '2026-07-15', '2026-07-15', '2026-09-30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `web_settings`
--

CREATE TABLE `web_settings` (
  `MaWebSetting` bigint(20) UNSIGNED NOT NULL,
  `TenWebsite` varchar(150) NOT NULL,
  `Logo` varchar(255) DEFAULT NULL,
  `DiaChi` varchar(255) NOT NULL,
  `EmailLienHe` varchar(150) NOT NULL,
  `SoDienThoai` varchar(20) NOT NULL,
  `NoiDungWebsite` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `web_settings`
--

INSERT INTO `web_settings` (`MaWebSetting`, `TenWebsite`, `Logo`, `DiaChi`, `EmailLienHe`, `SoDienThoai`, `NoiDungWebsite`, `created_at`, `updated_at`) VALUES
(1, 'BUFFET VIP', 'logo.png', '138 Hồng Bàng, Phường Phú Lâm, TP. Hồ Chí Minh', 'buffetvip@gmail.com', '0356522519', 'Buffet VIP mang đến trải nghiệm ẩm thực chất lượng cao với đa dạng món ăn Á - Âu, không gian sang trọng và dịch vụ tận tâm.', '2026-07-07 11:28:11', '2026-07-07 11:28:11');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `banner`
--
ALTER TABLE `banner`
  ADD PRIMARY KEY (`MaBanner`);

--
-- Chỉ mục cho bảng `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Chỉ mục cho bảng `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Chỉ mục cho bảng `chitiethoadon`
--
ALTER TABLE `chitiethoadon`
  ADD PRIMARY KEY (`MaChiTietHD`),
  ADD KEY `fk_cthd_loaive` (`MaLoaiVe`),
  ADD KEY `idx_cthd_hoadon` (`MaHoaDon`);

--
-- Chỉ mục cho bảng `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Chỉ mục cho bảng `hangthanhvien`
--
ALTER TABLE `hangthanhvien`
  ADD PRIMARY KEY (`MaHangThanhVien`),
  ADD KEY `fk_hang_quytac` (`MaQuyTac`);

--
-- Chỉ mục cho bảng `hoadon`
--
ALTER TABLE `hoadon`
  ADD PRIMARY KEY (`MaHoaDon`),
  ADD KEY `fk_hoadon_nhanvien` (`MaNhanVien`),
  ADD KEY `fk_hoadon_quytac` (`MaQuyTacHienTai`),
  ADD KEY `fk_hoadon_hang` (`MaHangThanhVien`),
  ADD KEY `idx_hoadon_ngaylap` (`NgayLap`),
  ADD KEY `idx_hoadon_khachhang` (`MaKhachHang`);

--
-- Chỉ mục cho bảng `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Chỉ mục cho bảng `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `khachhang`
--
ALTER TABLE `khachhang`
  ADD PRIMARY KEY (`MaKhachHang`),
  ADD UNIQUE KEY `SoDienThoai` (`SoDienThoai`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD KEY `fk_khachhang_hang` (`MaHangThanhVien`);

--
-- Chỉ mục cho bảng `lichsugiaodichdiem`
--
ALTER TABLE `lichsugiaodichdiem`
  ADD PRIMARY KEY (`MaGiaoDichDiem`),
  ADD KEY `idx_lsgdd_khachhang` (`MaKhachHang`);

--
-- Chỉ mục cho bảng `lichsuhangthanhvien`
--
ALTER TABLE `lichsuhangthanhvien`
  ADD PRIMARY KEY (`MaLichSuHang`),
  ADD KEY `fk_lshang_khachhang` (`MaKhachHang`),
  ADD KEY `fk_lshang_hangcu` (`MaHangThanhVienCu`),
  ADD KEY `fk_lshang_hangmoi` (`MaHangThanhVienMoi`);

--
-- Chỉ mục cho bảng `lichsuthaydoiquytac`
--
ALTER TABLE `lichsuthaydoiquytac`
  ADD PRIMARY KEY (`MaLichSuQuyTac`),
  ADD KEY `fk_lstd_quytac` (`MaQuyTac`),
  ADD KEY `fk_lstd_nhanvien` (`MaNhanVien`);

--
-- Chỉ mục cho bảng `loaive`
--
ALTER TABLE `loaive`
  ADD PRIMARY KEY (`MaLoaiVe`);

--
-- Chỉ mục cho bảng `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `nhanvien`
--
ALTER TABLE `nhanvien`
  ADD PRIMARY KEY (`MaNhanVien`),
  ADD UNIQUE KEY `TenDangNhap` (`TenDangNhap`);

--
-- Chỉ mục cho bảng `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Chỉ mục cho bảng `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Chỉ mục cho bảng `phanhoikhachhang`
--
ALTER TABLE `phanhoikhachhang`
  ADD PRIMARY KEY (`MaPhanHoi`),
  ADD UNIQUE KEY `MaHoaDon` (`MaHoaDon`),
  ADD KEY `fk_phanhoi_nhanvien` (`MaNhanVien`),
  ADD KEY `idx_phanhoi_khachhang` (`MaKhachHang`);

--
-- Chỉ mục cho bảng `quytactichdiem`
--
ALTER TABLE `quytactichdiem`
  ADD PRIMARY KEY (`MaQuyTac`);

--
-- Chỉ mục cho bảng `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Chỉ mục cho bảng `thongbao`
--
ALTER TABLE `thongbao`
  ADD PRIMARY KEY (`MaThongBao`),
  ADD KEY `fk_thongbao_khachhang` (`MaKhachHang`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Chỉ mục cho bảng `uudai`
--
ALTER TABLE `uudai`
  ADD PRIMARY KEY (`MaUuDai`),
  ADD KEY `fk_uudai_hang` (`MaHangThanhVien`);

--
-- Chỉ mục cho bảng `voucherkhachhang`
--
ALTER TABLE `voucherkhachhang`
  ADD PRIMARY KEY (`MaVoucherKhachHang`),
  ADD KEY `fk_voucher_uudai` (`MaUuDai`),
  ADD KEY `idx_voucher_khachhang` (`MaKhachHang`);

--
-- Chỉ mục cho bảng `web_settings`
--
ALTER TABLE `web_settings`
  ADD PRIMARY KEY (`MaWebSetting`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `web_settings`
--
ALTER TABLE `web_settings`
  MODIFY `MaWebSetting` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `chitiethoadon`
--
ALTER TABLE `chitiethoadon`
  ADD CONSTRAINT `fk_cthd_hoadon` FOREIGN KEY (`MaHoaDon`) REFERENCES `hoadon` (`MaHoaDon`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cthd_loaive` FOREIGN KEY (`MaLoaiVe`) REFERENCES `loaive` (`MaLoaiVe`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `hangthanhvien`
--
ALTER TABLE `hangthanhvien`
  ADD CONSTRAINT `fk_hang_quytac` FOREIGN KEY (`MaQuyTac`) REFERENCES `quytactichdiem` (`MaQuyTac`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `hoadon`
--
ALTER TABLE `hoadon`
  ADD CONSTRAINT `fk_hoadon_nhanvien` FOREIGN KEY (`MaNhanVien`) REFERENCES `nhanvien` (`MaNhanVien`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `khachhang`
--
ALTER TABLE `khachhang`
  ADD CONSTRAINT `fk_khachhang_hang` FOREIGN KEY (`MaHangThanhVien`) REFERENCES `hangthanhvien` (`MaHangThanhVien`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
