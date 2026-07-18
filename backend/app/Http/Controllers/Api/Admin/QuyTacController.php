<?php
// app/Http/Controllers/Api/Admin/QuyTacController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuyTacTichDiem;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class QuyTacController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    /**
     * Danh sách quy tắc (tìm theo mã + lọc trạng thái + phân trang).
     * params: search, trang_thai, per_page, page
     */
    public function index(Request $request)
    {
        $query = QuyTacTichDiem::query();

        if ($kw = trim((string) $request->query('search'))) {
            $query->where('MaQuyTac', 'like', "%{$kw}%");
        }
        if ($tt = $request->query('trang_thai')) {
            $query->where('TrangThai', $tt);
        }

        $query->orderBy('MaQuyTac', 'desc');

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

    public function show(string $ma)
    {
        $qt = QuyTacTichDiem::find($ma);

        if (!$qt) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy quy tắc'], 404);
        }

        return response()->json(['success' => true, 'data' => $qt]);
    }

    /**
     * Thêm quy tắc mới.
     */
    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $qt = DB::transaction(function () use ($data) {
            $qt = new QuyTacTichDiem();
            $qt->MaQuyTac     = $this->codes->next('quytactichdiem', 'MaQuyTac', 'QT');
            $qt->SoTienQuyDoi = $data['SoTienQuyDoi'];
            $qt->SoDiemNhan   = $data['SoDiemNhan'];
            $qt->NgayApDung   = $data['NgayApDung'];
            $qt->NgayHetHan   = $data['NgayHetHan'] ?: null;
            $qt->TrangThai    = 'HoatDong';
            $qt->GiaTriHoaDonToiThieu = $data['GiaTriHoaDonToiThieu'] ?? 0;
            $qt->HeSoNhanDiem         = $data['HeSoNhanDiem'] ?? 1;
            $qt->NhanDoiSinhNhat      = (int) ($data['NhanDoiSinhNhat'] ?? 0);
            $qt->save();

            return $qt;
        });

        return response()->json([
            'success' => true,
            'message' => 'Thêm quy tắc thành công',
            'data'    => $qt,
        ], 201);
    }

    /**
     * Cập nhật quy tắc (không đổi trạng thái ở đây, dùng nút bật/tắt riêng).
     * Nếu mức quy đổi thay đổi thì tự ghi vào lichsuthaydoiquytac.
     */
    public function update(Request $request, string $ma)
    {
        $qt = QuyTacTichDiem::find($ma);

        if (!$qt) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy quy tắc'], 404);
        }

        $data = $this->validateData($request);

        $newTien = $data['SoTienQuyDoi'];
        $newDiem = $data['SoDiemNhan'];

        DB::beginTransaction();
        try {
            $qt = QuyTacTichDiem::where('MaQuyTac', $ma)->lockForUpdate()->first();
            if (!$qt) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Không tìm thấy quy tắc'], 404);
            }

            $oldTien = $qt->SoTienQuyDoi;
            $oldDiem = $qt->SoDiemNhan;

            $qt->SoTienQuyDoi = $newTien;
            $qt->SoDiemNhan   = $newDiem;
            $qt->NgayApDung   = $data['NgayApDung'];
            $qt->NgayHetHan   = $data['NgayHetHan'] ?: null;
            $qt->GiaTriHoaDonToiThieu = $data['GiaTriHoaDonToiThieu'] ?? 0;
            $qt->HeSoNhanDiem         = $data['HeSoNhanDiem'] ?? 1;
            $qt->NhanDoiSinhNhat      = (int) ($data['NhanDoiSinhNhat'] ?? 0);
            $qt->save();

            // Chỉ ghi lịch sử khi mức quy đổi (tiền hoặc điểm) thực sự thay đổi
            if ((float) $oldTien != (float) $newTien || (int) $oldDiem != (int) $newDiem) {
                DB::table('lichsuthaydoiquytac')->insert([
                    'MaLichSuQuyTac'  => $this->codes->next(
                        'lichsuthaydoiquytac',
                        'MaLichSuQuyTac',
                        'LSQT'
                    ),
                    'MaQuyTac'        => $ma,
                    'SoTienQuyDoiCu'  => $oldTien,
                    'SoDiemNhanCu'    => $oldDiem,
                    'SoTienQuyDoiMoi' => $newTien,
                    'SoDiemNhanMoi'   => $newDiem,
                    'MaNhanVien'      => auth('nhanvien')->user()->MaNhanVien,
                    'GhiChu'          => $request->input('GhiChu') ?: null,
                    'ThoiGian'        => now(),
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Không thể cập nhật quy tắc tích điểm', [
                'rule_id' => $ma,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật quy tắc lúc này. Vui lòng thử lại.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật quy tắc thành công',
            'data'    => $qt,
        ]);
    }

    /**
     * Bật / tắt quy tắc (HoatDong <-> NgungApDung).
     */
    public function toggleTrangThai(string $ma)
    {
        $qt = QuyTacTichDiem::find($ma);

        if (!$qt) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy quy tắc'], 404);
        }

        $qt = DB::transaction(function () use ($ma) {
            $qt = QuyTacTichDiem::where('MaQuyTac', $ma)->lockForUpdate()->first();
            if (!$qt) return null;

            $qt->TrangThai = $qt->TrangThai === 'HoatDong' ? 'NgungApDung' : 'HoatDong';
            $qt->save();

            return $qt;
        });

        if (!$qt) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy quy tắc'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => $qt->TrangThai === 'HoatDong' ? 'Đã kích hoạt quy tắc' : 'Đã ngừng quy tắc',
            'data'    => $qt,
        ]);
    }

    /**
     * Lịch sử thay đổi quy tắc (chỉ đọc).
     * params: ma_quy_tac, per_page, page
     */
    public function lichSu(Request $request)
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

    private function validateData(Request $request): array
    {
        return $request->validate([
            'SoTienQuyDoi'         => ['required', 'numeric', 'gt:0'],
            'SoDiemNhan'           => ['required', 'integer', 'min:0'],
            'NgayApDung'           => ['required', 'date'],
            'NgayHetHan'           => ['nullable', 'date', 'after_or_equal:NgayApDung'],
            'GiaTriHoaDonToiThieu' => ['nullable', 'numeric', 'min:0'],
            'HeSoNhanDiem'         => ['nullable', 'numeric', 'min:1'],
            'NhanDoiSinhNhat'      => ['nullable', 'boolean'],
            'GhiChu'               => ['nullable', 'string', 'max:255'],
        ]);
    }
}
