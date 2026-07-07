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

    protected $fillable = [
        'MaLichSuHang',
        'MaKhachHang',
        'MaHangThanhVienCu',
        'MaHangThanhVienMoi',
        'ThoiGianThayDoi',
        'LyDoThayDoi',
        'DiemTaiThoiDiemTH',
        'TongChiTieuTaiThoiDiem',
    ];
    public function hangCu()
    {
        return $this->belongsTo(
            HangThanhVien::class,
            'MaHangThanhVienCu',
            'MaHangThanhVien'
        );
    }

    public function hangMoi()
    {
        return $this->belongsTo(
            HangThanhVien::class,
            'MaHangThanhVienMoi',
            'MaHangThanhVien'
        );
    }

    public function khachHang()
    {
        return $this->belongsTo(
            KhachHang::class,
            'MaKhachHang',
            'MaKhachHang'
        );
    }
}