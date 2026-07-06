<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class UuDai extends Model
{
    protected $table      = 'uudai';
    protected $primaryKey = 'MaUuDai';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;
 
    protected $fillable = [
        'MaUuDai','TenUuDai','SoDiemCanDoi','GiaTriGiam','MoTa',
        'SoLuongPhatHanh','NgayBatDau','NgayKetThuc','TrangThai',
        'MaHangThanhVien','SoLuongTon','NhomUuDai','CoTheDungChung','ThuTuApDung',
    ];
}