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

    protected $guarded = [];
    public function khachHang()
{
    return $this->belongsTo(KhachHang::class, 'MaKhachHang', 'MaKhachHang');
}

public function nhanVien()
{
    return $this->belongsTo(NhanVien::class, 'MaNhanVien', 'MaNhanVien');
}

public function chiTietHoaDons()
{
    return $this->hasMany(ChiTietHoaDon::class, 'MaHoaDon', 'MaHoaDon');
}

public function lichSuGiaoDichDiems()
{
    return $this->hasMany(LichSuGiaoDichDiem::class, 'MaHoaDon', 'MaHoaDon');
}

public function phanHoi()
{
    return $this->hasOne(PhanHoiKhachHang::class, 'MaHoaDon', 'MaHoaDon');
}
}