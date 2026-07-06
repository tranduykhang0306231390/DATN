<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhanHoiKhachHang extends Model
{
    protected $table = 'phanhoikhachhang';

    protected $primaryKey = 'MaPhanHoi';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];
}
