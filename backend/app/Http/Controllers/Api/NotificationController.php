<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ThongBao;

class NotificationController extends Controller
{
    //Danh sách thông báo của khách
    public function index()
    {
        $khachHang = auth('khachhang')->user();

        $list = ThongBao::where('MaKhachHang', $khachHang->MaKhachHang)
            ->orderByDesc('ThoiGian')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $list
        ]);
    }

    //Đếm số chưa đọc
    public function unreadCount()
    {
        $khachHang = auth('khachhang')->user();

        $count = ThongBao::where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'ChuaDoc')
            ->count();

        return response()->json([
            'count' => $count
        ]);
    }

    //Đánh dấu đã đọc
    public function readAll()
    {
        $khachHang = auth('khachhang')->user();

        ThongBao::where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'ChuaDoc')
            ->update([
                'TrangThai' => 'DaDoc'
            ]);

        return response()->json([
            'success'=>true
        ]);
    }
}