<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BanAn extends Model
{
    protected $table = 'banan';
    protected $primaryKey = 'MaBan';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'MaBan',
        'TenBan',
        'KhuVuc',
        'SucChua',
        'TrangThai',
    ];

    public function datBans()
    {
        return $this->hasMany(DatBan::class, 'MaBan', 'MaBan');
    }
}
