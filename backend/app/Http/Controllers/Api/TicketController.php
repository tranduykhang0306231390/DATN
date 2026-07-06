<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoaiVe;

class TicketController extends Controller
{
    /**
     * Danh sách vé cho khách tham khảo
     */
    public function index()
    {
        $tickets = LoaiVe::where("TrangThai", "HoatDong")
            ->orderBy("GiaVe")
            ->get();

        return response()->json([
            "success" => true,
            "data" => $tickets
        ]);
    }

    /**
     * Vé nổi bật ở trang Home
     */
    public function hot()
    {
        $tickets = LoaiVe::where("TrangThai", "HoatDong")
            ->orderByDesc("GiaVe")
            ->take(4)
            ->get();

        return response()->json([
            "success" => true,
            "data" => $tickets
        ]);
    }
}