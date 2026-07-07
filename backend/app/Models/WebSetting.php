<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebSetting extends Model
{
    protected $table = "web_settings";

    protected $primaryKey = "MaWebSetting";

    protected $fillable = [

        "TenWebsite",

        "Logo",

        "DiaChi",

        "EmailLienHe",

        "SoDienThoai",

        "NoiDungWebsite"

    ];
}