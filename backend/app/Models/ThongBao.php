<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThongBao extends Model
{
    protected $table = 'thongbao';
    protected $primaryKey = 'MaThongBao';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];

    public function khachHang()
    {
        return $this->belongsTo(KhachHang::class, 'MaKhachHang', 'MaKhachHang');
    }
}