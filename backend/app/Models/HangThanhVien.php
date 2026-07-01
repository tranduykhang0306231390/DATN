<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class HangThanhVien extends Model
{
    protected $table      = 'hangthanhvien';
    protected $primaryKey = 'MaHangThanhVien';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;
 
    protected $fillable = [
        'MaHangThanhVien','TenHang','MoTa','TongChiTieuToiThieu',
        'DiemToiThieu','ThuTuHang','MaQuyTac',
    ];
 
    public function quyTac()     { return $this->belongsTo(QuyTacTichDiem::class,'MaQuyTac','MaQuyTac'); }
    public function khachHangs() { return $this->hasMany(KhachHang::class,'MaHangThanhVien','MaHangThanhVien'); }
}
