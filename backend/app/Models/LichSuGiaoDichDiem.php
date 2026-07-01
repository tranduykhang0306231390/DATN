<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class LichSuGiaoDichDiem extends Model
{
<<<<<<< HEAD
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
=======
    protected $table      = 'lichsugiaodichdiem';
    protected $primaryKey = 'MaGiaoDichDiem';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;
 
    protected $fillable = [
        'MaGiaoDichDiem','LoaiGiaoDich','SoDiem','SoDiemTruoc',
        'SoDiemSau','MaKhachHang','MaThamChieu','ThoiGianGiaoDich',
    ];
>>>>>>> 6605e29e98dff2a474acf8ecbecbaca207846763
}