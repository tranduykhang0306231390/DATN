<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuyTacTichDiem extends Model
{
    protected $table      = 'quytactichdiem';
    protected $primaryKey = 'MaQuyTac';
    public    $incrementing = false;   
    protected $keyType    = 'string';
    public    $timestamps = false;     

    protected $fillable = [
        'MaQuyTac', 'SoTienQuyDoi', 'SoDiemNhan',
        'NgayApDung', 'NgayHetHan', 'TrangThai',
        'GiaTriHoaDonToiThieu', 
        'HeSoNhanDiem', 'NhanDoiSinhNhat'
    ];

}