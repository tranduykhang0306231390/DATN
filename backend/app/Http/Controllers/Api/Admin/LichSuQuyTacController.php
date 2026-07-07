<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LichSuQuyTacController extends Controller
{
    /**
     * Danh sách lịch sử thay đổi quy tắc.
     * params: ma_quy_tac, per_page, page
     */
    public function index(Request $request)
    {
        $query = DB::table('lichsuthaydoiquytac as ls')
            ->leftJoin('nhanvien as nv', 'ls.MaNhanVien', '=', 'nv.MaNhanVien')
            ->select('ls.*', 'nv.HoTen as TenNhanVien');

        if ($ma = trim((string) $request->query('ma_quy_tac'))) {
            $query->where('ls.MaQuyTac', 'like', "%{$ma}%");
        }

        $query->orderBy('ls.MaLichSuQuyTac', 'desc');

        $perPage   = max(1, min(100, (int) $request->query('per_page', 10)));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success'    => true,
            'data'       => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }
}