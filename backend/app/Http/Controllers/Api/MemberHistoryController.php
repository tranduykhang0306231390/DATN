<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LichSuGiaoDichDiem;
use Illuminate\Http\Request;

class MemberHistoryController extends Controller
{
    public function index(Request $request)
    {
        $user = auth('khachhang')->user();

        $history = LichSuGiaoDichDiem::where(
                'MaKhachHang',
                $user->MaKhachHang
            )
            ->orderByDesc('ThoiGianGiaoDich')
            ->paginate(10);

        return response()->json($history);
    }
}