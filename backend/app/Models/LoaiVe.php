<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class LoaiVe extends Model
{
    protected $table      = 'loaive';
    protected $primaryKey = 'MaLoaiVe';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;
 
    protected $fillable = ['MaLoaiVe', 'TenLoaiVe', 'BuoiAn', 'LoaiNgay', 'GiaVe', 'TrangThai'];
}
