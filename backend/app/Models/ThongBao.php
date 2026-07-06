<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Thongbao extends Model
{
    protected $table      = 'thongbao';
    protected $primaryKey = 'MaThongBao';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;
 
    protected $fillable = ['MaThongBao','TieuDe','NoiDung','ThoiGian','TrangThai','MaKhachHang'];
}