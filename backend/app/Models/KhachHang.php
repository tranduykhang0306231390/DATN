<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class KhachHang extends Authenticatable implements JWTSubject
{
    protected $table = 'khachhang';

    protected $primaryKey = 'MaKhachHang';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];
protected $hidden = [
    'MatKhau'
];
    // ===== JWT =====

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    // ===== Relationships =====

    public function hangThanhVien()
    {
        return $this->belongsTo(
            HangThanhVien::class,
            'MaHangThanhVien',
            'MaHangThanhVien'
        );
    }

    public function hoaDons()
    {
        return $this->hasMany(
            HoaDon::class,
            'MaKhachHang',
            'MaKhachHang'
        );
    }

    public function lichSuGiaoDichDiems()
    {
        return $this->hasMany(
            LichSuGiaoDichDiem::class,
            'MaKhachHang',
            'MaKhachHang'
        );
    }

    public function voucherKhachHangs()
    {
        return $this->hasMany(
            VoucherKhachHang::class,
            'MaKhachHang',
            'MaKhachHang'
        );
    }

    public function phanHois()
    {
        return $this->hasMany(
            PhanHoiKhachHang::class,
            'MaKhachHang',
            'MaKhachHang'
        );
    }
}