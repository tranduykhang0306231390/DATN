<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LichSuHangThanhVien;

class MemberRankHistoryController extends Controller
{
    public function index()
    {
        $user = auth('khachhang')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $history = LichSuHangThanhVien::with([
            'hangCu',
            'hangMoi'
        ])
        ->where(
            'MaKhachHang',
            $user->MaKhachHang
        )
        ->orderBy(
            'ThoiGianThayDoi',
            'asc'
        )
        ->get();

        return response()->json($history);
    }
}