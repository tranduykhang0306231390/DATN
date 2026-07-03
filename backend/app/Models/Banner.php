<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $table = "banner";

    protected $primaryKey = "MaBanner";

    public $incrementing = false;

    protected $keyType = "string";

    public $timestamps = false;

    protected $guarded = [];
}