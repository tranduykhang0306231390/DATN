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
        'DiemSuDung',
        'DiemTichLuy',
        'TrangThai',
        'MaNhanVien',
        'MaKhachHang',
        'MaQuyTacHienTai',
        'MaHangThanhVien',
        'MaVoucher',
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
}