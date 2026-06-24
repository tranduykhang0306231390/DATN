<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichSuHangThanhVien extends Model
{
    protected $table = 'lichsuhangthanhvien';
    protected $primaryKey = 'MaLichSuHang';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];
}