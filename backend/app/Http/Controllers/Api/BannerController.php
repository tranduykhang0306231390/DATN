<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;

class BannerController extends Controller
{
   public function index()
{
    return Banner::where("TrangThai", 1)
        ->orderBy("ThuTu")
        ->get()
        ->map(function ($item) {
            $item->Link = asset("banner/" . basename($item->Link));
            return $item;
        });
}
}