<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoaiVe;
use Illuminate\Support\Facades\DB;

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
        $sales = DB::table('chitiethoadon as detail')
            ->join('hoadon as invoice', 'detail.MaHoaDon', '=', 'invoice.MaHoaDon')
            ->where('invoice.TrangThai', 'DaThanhToan')
            ->groupBy('detail.MaLoaiVe')
            ->selectRaw('detail.MaLoaiVe, SUM(detail.SoLuong) AS SoLuongDaBan');

        $tickets = LoaiVe::query()
            ->leftJoinSub($sales, 'sales', 'loaive.MaLoaiVe', '=', 'sales.MaLoaiVe')
            ->where('loaive.TrangThai', 'HoatDong')
            ->orderByRaw('COALESCE(sales.SoLuongDaBan, 0) DESC')
            ->orderByDesc('loaive.GiaVe')
            ->take(4)
            ->get('loaive.*');

        return response()->json([
            "success" => true,
            "data" => $tickets
        ]);
    }
}
