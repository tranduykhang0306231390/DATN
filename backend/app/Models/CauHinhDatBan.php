<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CauHinhDatBan extends Model
{
    protected $table = 'cauhinhdatban';

    protected $primaryKey = 'MaCauHinh';

    protected $fillable = [
        'ThoiGianGiuChoPhut',
        'SoPhutDatToiThieu',
        'ThoiLuongPhucVuPhut',
        'SoKhachToiThieu',
        'SoKhachToiDa',
        'PhutGiuBanSauGioHen',
        'MucCocMoiKhach',
        'SoGioHuyMienPhi',
        'SoGioHuyMotPhan',
        'PhanTramHoanMotPhan',
    ];
}
