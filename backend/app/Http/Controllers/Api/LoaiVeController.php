<?php
// app/Http/Controllers/Api/LoaiVeController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoaiVe;

class LoaiVeController extends Controller
{
    /**
     * Lấy danh sách loại vé đang hoạt động
     */
    public function index()
    {
        $loaiVe = LoaiVe::where('TrangThai', 'HoatDong')->get();

        return response()->json([
            'success' => true,
            'data'    => $loaiVe
        ]);
    }
}