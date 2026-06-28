<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use Illuminate\Http\Request;

class MemberPointController extends Controller
{
    public function index()
    {
        $user = auth('khachhang')->user();

        $tongHoaDon = HoaDon::where(
            'MaKhachHang',
            $user->MaKhachHang
        )->count();

        $tongChiTieu = HoaDon::where(
            'MaKhachHang',
            $user->MaKhachHang
        )->sum('TongTien');

        $tongDiemNhan = HoaDon::where(
            'MaKhachHang',
            $user->MaKhachHang
        )->sum('DiemTichLuy');

        $tongDiemDaDung = HoaDon::where(
            'MaKhachHang',
            $user->MaKhachHang
        )->sum('DiemSuDung');

        return response()->json([

            "TongDiem" => $user->TongDiem,

            "HangThanhVien" => $user->MaHangThanhVien,

            "TongHoaDon" => $tongHoaDon,

            "TongChiTieu" => $tongChiTieu,

            "TongDiemNhan" => $tongDiemNhan,

            "TongDiemDaDung" => $tongDiemDaDung

        ]);
    }
}