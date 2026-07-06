<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class LichSuGiaoDichDiem extends Model
{
    protected $table = 'lichsugiaodichdiem';

    protected $primaryKey = 'MaGiaoDichDiem';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function khachHang()
    {
        return $this->belongsTo(
            KhachHang::class,
            'MaKhachHang',
            'MaKhachHang'
        );
    }
}