<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class VoucherKhachHang extends Model
{
    protected $table      = 'voucherkhachhang';
    protected $primaryKey = 'MaVoucherKhachHang';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;
 
    protected $fillable = [
        'MaVoucherKhachHang', 'TrangThai', 'MaKhachHang',
        'MaUuDai', 'NgaySuDung', 'NgayCap', 'NgayHetHan',
    ];
 
    public function uuDai()     { return $this->belongsTo(UuDai::class,    'MaUuDai',     'MaUuDai'); }
    public function khachHang() { return $this->belongsTo(KhachHang::class,'MaKhachHang','MaKhachHang'); }
}
