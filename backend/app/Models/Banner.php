<?php
// app/Models/Banner.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $table      = 'banner';
    protected $primaryKey = 'MaBanner';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;

    protected $fillable = [
        'MaBanner', 'TieuDe', 'HinhAnh', 'Link', 'ThuTu', 'TrangThai',
    ];

    protected $casts = [
        'ThuTu'     => 'integer',
        'TrangThai' => 'integer',   // 1 = hiện, 0 = ẩn
    ];
}