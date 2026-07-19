<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DatBan extends Model
{
    protected $table = 'datban';
    protected $primaryKey = 'MaDatBan';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'MaDatBan',
        'MaKhachHang',
        'MaBan',
        'MaNhanVienXuLy',
        'MaHoaDon',
        'ThoiGianDat',
        'BuoiAn',
        'SoLuongKhach',
        'TrangThai',
        'TrangThaiCoc',
        'SoTienCoc',
        'MaGiaoDichCoc',
        'NganHangHoanTien',
        'SoTaiKhoanHoanTien',
        'TenChuTaiKhoanHoanTien',
        'SoTienHoan',
        'TrangThaiHoanTien',
        'MaNhanVienXuLyHoanTien',
        'ThoiGianHoanTien',
        'GhiChu',
        'LyDoTuChoiHuy',
        'ThoiGianTao',
        'ThoiGianXacNhan',
        'ThoiGianCheckIn',
        'ThoiGianHuy',
    ];

    protected $casts = [
        'ThoiGianDat' => 'datetime',
        'ThoiGianTao' => 'datetime',
        'ThoiGianXacNhan' => 'datetime',
        'ThoiGianCheckIn' => 'datetime',
        'ThoiGianHuy' => 'datetime',
        'ThoiGianHoanTien' => 'datetime',
    ];

    public function khachHang()
    {
        return $this->belongsTo(KhachHang::class, 'MaKhachHang', 'MaKhachHang');
    }

    public function banAn()
    {
        return $this->belongsTo(BanAn::class, 'MaBan', 'MaBan');
    }

    public function nhanVienXuLy()
    {
        return $this->belongsTo(NhanVien::class, 'MaNhanVienXuLy', 'MaNhanVien');
    }

    public function nhanVienXuLyHoanTien()
    {
        return $this->belongsTo(NhanVien::class, 'MaNhanVienXuLyHoanTien', 'MaNhanVien');
    }

    public function hoaDon()
    {
        return $this->belongsTo(HoaDon::class, 'MaHoaDon', 'MaHoaDon');
    }
}
