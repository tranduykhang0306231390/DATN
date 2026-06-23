CREATE DATABASE IF NOT EXISTS datn_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE datn_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS phanhoikhachhang;
DROP TABLE IF EXISTS thongbao;
DROP TABLE IF EXISTS lichsugiaodichdiem;
DROP TABLE IF EXISTS chitiethoadon;
DROP TABLE IF EXISTS hoadon;
DROP TABLE IF EXISTS voucherkhachhang;
DROP TABLE IF EXISTS uudai;
DROP TABLE IF EXISTS lichsuthaydoiquytac;
DROP TABLE IF EXISTS lichsuhangthanhvien;
DROP TABLE IF EXISTS khachhang;
DROP TABLE IF EXISTS hangthanhvien;
DROP TABLE IF EXISTS quytactichdiem;
DROP TABLE IF EXISTS loaive;
DROP TABLE IF EXISTS nhanvien;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE nhanvien (
  MaNhanVien VARCHAR(20) PRIMARY KEY,
  TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
  MatKhau VARCHAR(255) NOT NULL,
  HoTen VARCHAR(100) NOT NULL,
  VaiTro VARCHAR(50) NOT NULL,
  TrangThai VARCHAR(20) NOT NULL DEFAULT 'HoatDong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quytactichdiem (
  MaQuyTac VARCHAR(20) PRIMARY KEY,
  SoTienQuyDoi DECIMAL(18,2) NOT NULL,
  SoDiemNhan INT NOT NULL,
  NgayApDung DATE NOT NULL,
  NgayHetHan DATE NULL,
  TrangThai VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
  CHECK (SoTienQuyDoi > 0),
  CHECK (SoDiemNhan >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hangthanhvien (
  MaHangThanhVien VARCHAR(20) PRIMARY KEY,
  TenHang VARCHAR(50) NOT NULL,
  MoTa VARCHAR(255) NULL,
  TongChiTieuToiThieu DECIMAL(18,2) NOT NULL DEFAULT 0,
  DiemToiThieu INT NOT NULL DEFAULT 0,
  ThuTuHang INT NOT NULL,
  MaQuyTac VARCHAR(20) NOT NULL,
  CONSTRAINT fk_hang_quytac
    FOREIGN KEY (MaQuyTac) REFERENCES quytactichdiem(MaQuyTac)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (TongChiTieuToiThieu >= 0),
  CHECK (DiemToiThieu >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE khachhang (
  MaKhachHang VARCHAR(20) PRIMARY KEY,
  HoTen VARCHAR(100) NOT NULL,
  NgaySinh DATE NULL,
  GioiTinh VARCHAR(10) NULL,
  NgayDangKy DATE NOT NULL DEFAULT (CURRENT_DATE),
  Email VARCHAR(100) NULL UNIQUE,
  SoDienThoai VARCHAR(15) NOT NULL UNIQUE,
  MatKhau VARCHAR(255) NOT NULL,
  TrangThai VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
  MaHangThanhVien VARCHAR(20) NOT NULL,
  TongDiem INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_khachhang_hang
    FOREIGN KEY (MaHangThanhVien) REFERENCES hangthanhvien(MaHangThanhVien)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (TongDiem >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE loaive (
  MaLoaiVe VARCHAR(20) PRIMARY KEY,
  TenLoaiVe VARCHAR(100) NOT NULL,
  BuoiAn VARCHAR(50) NOT NULL,
  LoaiNgay VARCHAR(50) NOT NULL,
  GiaVe DECIMAL(18,2) NOT NULL,
  TrangThai VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
  CHECK (GiaVe >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE uudai (
  MaUuDai VARCHAR(20) PRIMARY KEY,
  TenUuDai VARCHAR(100) NOT NULL,
  SoDiemCanDoi INT NOT NULL,
  GiaTriGiam DECIMAL(18,2) NOT NULL DEFAULT 0,
  MoTa VARCHAR(255) NULL,
  SoLuongPhatHanh INT NOT NULL DEFAULT 0,
  NgayBatDau DATE NOT NULL,
  NgayKetThuc DATE NOT NULL,
  TrangThai VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
  MaHangThanhVien VARCHAR(20) NULL,
  SoLuongTon INT NOT NULL DEFAULT 0,
  NhomUuDai VARCHAR(255) NULL,
  CoTheDungChung BOOLEAN NOT NULL DEFAULT FALSE,
  ThuTuApDung INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_uudai_hang
    FOREIGN KEY (MaHangThanhVien) REFERENCES hangthanhvien(MaHangThanhVien)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CHECK (SoDiemCanDoi >= 0),
  CHECK (GiaTriGiam >= 0),
  CHECK (SoLuongPhatHanh >= 0),
  CHECK (SoLuongTon >= 0),
  CHECK (NgayKetThuc >= NgayBatDau)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE voucherkhachhang (
  MaVoucherKhachHang VARCHAR(20) PRIMARY KEY,
  TrangThai VARCHAR(20) NOT NULL DEFAULT 'ChuaSuDung',
  MaKhachHang VARCHAR(20) NOT NULL,
  MaUuDai VARCHAR(20) NOT NULL,
  NgaySuDung DATE NULL,
  NgayCap DATE NOT NULL DEFAULT (CURRENT_DATE),
  NgayHetHan DATE NOT NULL,
  CONSTRAINT fk_voucher_khachhang
    FOREIGN KEY (MaKhachHang) REFERENCES khachhang(MaKhachHang)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_voucher_uudai
    FOREIGN KEY (MaUuDai) REFERENCES uudai(MaUuDai)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hoadon (
  MaHoaDon VARCHAR(20) PRIMARY KEY,
  NgayLap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  TongTien DECIMAL(18,2) NOT NULL DEFAULT 0,
  DiemSuDung INT NOT NULL DEFAULT 0,
  DiemTichLuy INT NOT NULL DEFAULT 0,
  TrangThai VARCHAR(20) NOT NULL DEFAULT 'DaThanhToan',
  MaNhanVien VARCHAR(20) NOT NULL,
  MaKhachHang VARCHAR(20) NULL,
  MaQuyTacHienTai VARCHAR(20) NULL,
  MaHangThanhVien VARCHAR(20) NULL,
  MaVoucher VARCHAR(255) NULL,
  CONSTRAINT fk_hoadon_nhanvien
    FOREIGN KEY (MaNhanVien) REFERENCES nhanvien(MaNhanVien)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_hoadon_khachhang
    FOREIGN KEY (MaKhachHang) REFERENCES khachhang(MaKhachHang)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_hoadon_quytac
    FOREIGN KEY (MaQuyTacHienTai) REFERENCES quytactichdiem(MaQuyTac)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_hoadon_hang
    FOREIGN KEY (MaHangThanhVien) REFERENCES hangthanhvien(MaHangThanhVien)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CHECK (TongTien >= 0),
  CHECK (DiemSuDung >= 0),
  CHECK (DiemTichLuy >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chitiethoadon (
  MaChiTietHD VARCHAR(20) PRIMARY KEY,
  SoLuong INT NOT NULL,
  DonGia DECIMAL(18,2) NOT NULL,
  MaHoaDon VARCHAR(20) NOT NULL,
  MaLoaiVe VARCHAR(20) NOT NULL,
  CONSTRAINT fk_cthd_hoadon
    FOREIGN KEY (MaHoaDon) REFERENCES hoadon(MaHoaDon)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cthd_loaive
    FOREIGN KEY (MaLoaiVe) REFERENCES loaive(MaLoaiVe)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (SoLuong > 0),
  CHECK (DonGia >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lichsugiaodichdiem (
  MaGiaoDichDiem VARCHAR(20) PRIMARY KEY,
  LoaiGiaoDich VARCHAR(50) NOT NULL,
  SoDiem INT NOT NULL,
  SoDiemTruoc INT NOT NULL,
  SoDiemSau INT NOT NULL,
  MaKhachHang VARCHAR(20) NOT NULL,
  MaThamChieu VARCHAR(20) NULL,
  ThoiGianGiaoDich DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT fk_lsgdd_khachhang
    FOREIGN KEY (MaKhachHang) REFERENCES khachhang(MaKhachHang)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (SoDiem >= 0),
  CHECK (SoDiemTruoc >= 0),
  CHECK (SoDiemSau >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE thongbao (
  MaThongBao VARCHAR(20) PRIMARY KEY,
  TieuDe VARCHAR(255) NOT NULL,
  NoiDung VARCHAR(500) NOT NULL,
  ThoiGian DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  TrangThai VARCHAR(20) NOT NULL DEFAULT 'ChuaDoc',
  MaKhachHang VARCHAR(20) NOT NULL,
  CONSTRAINT fk_thongbao_khachhang
    FOREIGN KEY (MaKhachHang) REFERENCES khachhang(MaKhachHang)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE phanhoikhachhang (
  MaPhanHoi VARCHAR(20) PRIMARY KEY,
  DiemDanhGia INT NOT NULL,
  NoiDungCuaKhachHang VARCHAR(500) NOT NULL,
  ThoiGian DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MaKhachHang VARCHAR(20) NOT NULL,
  NoiDungPhanHoiCuaHang VARCHAR(500) NULL,
  TrangThaiXuLy VARCHAR(20) NOT NULL DEFAULT 'ChuaXuLy',
  ThoiGianPhanHoi DATETIME NULL,
  MaNhanVien VARCHAR(20) NULL,
  MaHoaDon VARCHAR(20) NULL UNIQUE,
  CONSTRAINT fk_phanhoi_khachhang
    FOREIGN KEY (MaKhachHang) REFERENCES khachhang(MaKhachHang)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_phanhoi_nhanvien
    FOREIGN KEY (MaNhanVien) REFERENCES nhanvien(MaNhanVien)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_phanhoi_hoadon
    FOREIGN KEY (MaHoaDon) REFERENCES hoadon(MaHoaDon)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CHECK (DiemDanhGia BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lichsuthaydoiquytac (
  MaLichSuQuyTac VARCHAR(20) PRIMARY KEY,
  MaQuyTac VARCHAR(20) NOT NULL,
  SoTienQuyDoiCu DECIMAL(18,2) NOT NULL,
  SoDiemNhanCu INT NOT NULL,
  SoTienQuyDoiMoi DECIMAL(18,2) NOT NULL,
  SoDiemNhanMoi INT NOT NULL,
  MaNhanVien VARCHAR(20) NOT NULL,
  GhiChu VARCHAR(255) NULL,
  ThoiGian DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT fk_lstd_quytac FOREIGN KEY (MaQuyTac) REFERENCES quytactichdiem(MaQuyTac)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_lstd_nhanvien FOREIGN KEY (MaNhanVien) REFERENCES nhanvien(MaNhanVien)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (SoTienQuyDoiCu >= 0),
  CHECK (SoTienQuyDoiMoi >= 0),
  CHECK (SoDiemNhanCu >= 0),
  CHECK (SoDiemNhanMoi >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lichsuhangthanhvien (
  MaLichSuHang VARCHAR(20) PRIMARY KEY,
  MaKhachHang VARCHAR(20) NOT NULL,
  MaHangThanhVienCu VARCHAR(20) NULL,
  MaHangThanhVienMoi VARCHAR(20) NOT NULL,
  ThoiGianThayDoi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  LyDoThayDoi VARCHAR(255) NULL,
  DiemTaiThoiDiemTH VARCHAR(20) NULL,
  TongChiTieuTaiThoiDiem DECIMAL(18,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_lshang_khachhang
    FOREIGN KEY (MaKhachHang) REFERENCES khachhang(MaKhachHang)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_lshang_hangcu
    FOREIGN KEY (MaHangThanhVienCu) REFERENCES hangthanhvien(MaHangThanhVien)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_lshang_hangmoi
    FOREIGN KEY (MaHangThanhVienMoi) REFERENCES hangthanhvien(MaHangThanhVien)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (TongChiTieuTaiThoiDiem >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_hoadon_ngaylap ON hoadon(NgayLap);
CREATE INDEX idx_hoadon_khachhang ON hoadon(MaKhachHang);
CREATE INDEX idx_cthd_hoadon ON chitiethoadon(MaHoaDon);
CREATE INDEX idx_voucher_khachhang ON voucherkhachhang(MaKhachHang);
CREATE INDEX idx_lsgdd_khachhang ON lichsugiaodichdiem(MaKhachHang);
CREATE INDEX idx_phanhoi_khachhang ON phanhoikhachhang(MaKhachHang);


-- =====================
-- SEED DATA
-- =====================

INSERT INTO nhanvien (MaNhanVien, TenDangNhap, MatKhau, HoTen, VaiTro, TrangThai) VALUES
('NV001','admin','123456','Admin Hệ Thống','Admin','HoatDong'),
('NV002','thungan1','123456','Nguyễn Văn A','NhanVien','HoatDong');

INSERT INTO quytactichdiem (MaQuyTac,SoTienQuyDoi,SoDiemNhan,NgayApDung,NgayHetHan,TrangThai) VALUES
('QT001',10000,1,'2026-01-01','2030-12-31','HoatDong');

INSERT INTO hangthanhvien (MaHangThanhVien,TenHang,MoTa,TongChiTieuToiThieu,DiemToiThieu,ThuTuHang,MaQuyTac) VALUES
('HTV001','Đồng','Khách hàng mới',0,0,1,'QT001'),
('HTV002','Bạc','Khách hàng thân thiết',5000000,500,2,'QT001'),
('HTV003','Vàng','Khách hàng VIP',20000000,2000,3,'QT001');
