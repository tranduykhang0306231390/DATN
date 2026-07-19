<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HoaDon extends Model
{
    protected $table = 'hoadon';
    protected $primaryKey = 'MaHoaDon';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'MaHoaDon',
        'NgayLap',
        'TongTien',
        'DiemTichLuy',
        'TrangThai',
        'MaNhanVien',
        'MaKhachHang',
        'MaQuyTacHienTai',
        'MaHangThanhVien',
        'MaVoucher',
        'SoBan',
        'LyDoHuy',
        'ThoiGianHuy',
        'MaNhanVienHuy',
        'MaDatBan',
    ];

    public function chiTietHoaDon()
    {
        return $this->hasMany(ChiTietHoaDon::class, 'MaHoaDon', 'MaHoaDon');
    }
    public function khachHang()
    {
        return $this->belongsTo(KhachHang::class, 'MaKhachHang', 'MaKhachHang');
    }
    public function nhanVien()
    {
        return $this->belongsTo(NhanVien::class, 'MaNhanVien', 'MaNhanVien');
    }
    public function nhanVienHuy()
    {
        return $this->belongsTo(NhanVien::class, 'MaNhanVienHuy', 'MaNhanVien');
    }
    public function hangThanhVien()
    {
        return $this->belongsTo(HangThanhVien::class, 'MaHangThanhVien', 'MaHangThanhVien');
    }
    public function voucherKhachHang()
    {
        return $this->belongsTo(
            VoucherKhachHang::class,
            'MaVoucher',
            'MaVoucherKhachHang'
        );
    }
    public function datBan()
    {
        return $this->belongsTo(DatBan::class, 'MaDatBan', 'MaDatBan');
    }

}