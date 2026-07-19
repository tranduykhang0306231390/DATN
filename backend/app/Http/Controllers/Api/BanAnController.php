<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BanAn;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BanAnController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    public function index(Request $request)
    {
        $query = BanAn::query();

        if (!$request->boolean('tat_ca')) {
            $query->where('TrangThai', 'HoatDong');
        }

        $data = $query->orderBy('MaBan')->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function adminIndex(Request $request)
    {
        $query = BanAn::query();

        if ($kw = trim((string) $request->query('search'))) {
            $query->where(function ($sub) use ($kw) {
                $sub->where('TenBan', 'like', "%{$kw}%")
                    ->orWhere('MaBan', 'like', "%{$kw}%")
                    ->orWhere('KhuVuc', 'like', "%{$kw}%");
            });
        }

        if ($kv = $request->query('khu_vuc')) {
            $query->where('KhuVuc', $kv);
        }

        if ($tt = $request->query('trang_thai')) {
            $query->where('TrangThai', $tt);
        }

        $query->orderBy('MaBan');

        $perPage = max(1, min(100, (int) $request->query('per_page', 10)));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'TenBan' => ['required', 'string', 'max:50'],
            'KhuVuc' => ['required', 'string', 'max:50'],
            'SucChua' => ['required', 'integer', 'min:1', 'max:100'],
            'TrangThai' => ['nullable', Rule::in(['HoatDong', 'BaoTri', 'NgungPhucVu'])],
        ]);

        $ban = \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $ban = new BanAn();
            $ban->MaBan = $this->codes->next('banan', 'MaBan', 'BA');
            $ban->TenBan = $data['TenBan'];
            $ban->KhuVuc = $data['KhuVuc'];
            $ban->SucChua = $data['SucChua'];
            $ban->TrangThai = $data['TrangThai'] ?? 'HoatDong';
            $ban->save();

            return $ban;
        });

        return response()->json([
            'success' => true,
            'message' => 'Thêm bàn ăn thành công',
            'data' => $ban,
        ], 201);
    }

    public function update(Request $request, string $ma)
    {
        $ban = BanAn::find($ma);

        if (!$ban) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bàn ăn',
            ], 404);
        }

        $data = $request->validate([
            'TenBan' => ['required', 'string', 'max:50'],
            'KhuVuc' => ['required', 'string', 'max:50'],
            'SucChua' => ['required', 'integer', 'min:1', 'max:100'],
            'TrangThai' => ['required', Rule::in(['HoatDong', 'BaoTri', 'NgungPhucVu'])],
        ]);

        $ban->TenBan = $data['TenBan'];
        $ban->KhuVuc = $data['KhuVuc'];
        $ban->SucChua = $data['SucChua'];
        $ban->TrangThai = $data['TrangThai'];
        $ban->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật bàn ăn thành công',
            'data' => $ban,
        ]);
    }

    /**
     * Đổi trạng thái bàn ăn: HoatDong / BaoTri / NgungPhucVu.
     * Không xóa cứng vì bàn còn được tham chiếu bởi datban/hoadon.
     */
    public function capNhatTrangThai(Request $request, string $ma)
    {
        $ban = BanAn::find($ma);

        if (!$ban) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bàn ăn',
            ], 404);
        }

        $data = $request->validate([
            'TrangThai' => ['required', Rule::in(['HoatDong', 'BaoTri', 'NgungPhucVu'])],
        ]);

        $ban->TrangThai = $data['TrangThai'];
        $ban->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật trạng thái bàn ăn',
            'data' => $ban,
        ]);
    }
}
