<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class ChiTietHoaDon extends Model
{
    protected $table      = 'chitiethoadon';
    protected $primaryKey = 'MaChiTietHD';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;
 
    protected $fillable = ['MaChiTietHD', 'SoLuong', 'DonGia', 'MaHoaDon', 'MaLoaiVe'];
 
    public function loaiVe() { return $this->belongsTo(LoaiVe::class, 'MaLoaiVe', 'MaLoaiVe'); }
}
