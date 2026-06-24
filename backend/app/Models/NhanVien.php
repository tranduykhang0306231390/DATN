<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NhanVien extends Model
{
    protected $table = 'nhanvien';

    protected $primaryKey = 'MaNhanVien';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];
    public function hoaDons()
{
    return $this->hasMany(HoaDon::class, 'MaNhanVien', 'MaNhanVien');
}

public function phanHoiXuLys()
{
    return $this->hasMany(PhanHoiKhachHang::class, 'MaNhanVien', 'MaNhanVien');
}

public function lichSuThayDoiQuyTacs()
{
    return $this->hasMany(LichSuThayDoiQuyTac::class, 'MaNhanVien', 'MaNhanVien');
}
}