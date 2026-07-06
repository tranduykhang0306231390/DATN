<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class NhanVien extends Authenticatable implements JWTSubject
{
    protected $table = 'nhanvien';

    protected $primaryKey = 'MaNhanVien';

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

    public function getJWTCustomClaims():array
    {
        return [];
    }

    // ===== Relationships =====

    public function hoaDons()
    {
        return $this->hasMany(HoaDon::class, 'MaNhanVien', 'MaNhanVien');
    }

    public function phanHoiXuLys()
    {
        return $this->hasMany(
            PhanHoiKhachHang::class,
            'MaNhanVien',
            'MaNhanVien'
        );
    }

    public function lichSuThayDoiQuyTacs()
    {
        return $this->hasMany(
            LichSuThayDoiQuyTac::class,
            'MaNhanVien',
            'MaNhanVien'
        );
    }
     public function getAuthPassword()
    {
        return $this->MatKhau;
    }
}