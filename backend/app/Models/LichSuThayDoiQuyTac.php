<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichSuThayDoiQuyTac extends Model
{
    protected $table = 'lichsuthaydoiquytac';
    protected $primaryKey = 'MaLichSuQuyTac';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];

    public function nhanVien()
    {
        return $this->belongsTo(NhanVien::class, 'MaNhanVien', 'MaNhanVien');
    }

    public function quyTacTichDiem()
    {
        return $this->belongsTo(QuyTacTichDiem::class, 'MaQuyTac', 'MaQuyTac');
    }
}