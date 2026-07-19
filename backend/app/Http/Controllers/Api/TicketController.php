<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoaiVe;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    /**
     * Danh sách vé cho khách tham khảo.
     *
     * Trả về toàn bộ vé đang hoạt động (không lọc theo thời điểm — đây là
     * bảng giá tham khảo, khách có thể xem trước vé của buổi/ngày khác).
     * Kèm theo ngày/buổi hiện tại để frontend gắn nhãn "Áp dụng bây giờ"
     * cho đúng vé, khớp với bộ lọc nhân viên dùng khi tạo hóa đơn
     * (LoaiVeController::index).
     */
    public function index()
    {
        $tickets = LoaiVe::where("TrangThai", "HoatDong")
            ->orderBy("GiaVe")
            ->get();

        return response()->json([
            "success" => true,
            "data" => $tickets,
            "hien_tai" => $this->thoiDiemHienTai(),
        ]);
    }

    private function thoiDiemHienTai(): array
    {
        $now = now();
        $laCuoiTuan = in_array($now->dayOfWeek, [0, 6], true);

        return [
            'LoaiNgay' => $laCuoiTuan ? 'CuoiTuan' : 'NgayThuong',
            'BuoiAn' => $now->hour < 16 ? 'Trua' : 'Toi',
        ];
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
