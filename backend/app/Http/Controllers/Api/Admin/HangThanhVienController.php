<?php
// app/Http/Controllers/Api/Admin/HangThanhVienController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HangThanhVien;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HangThanhVienController extends Controller
{
    /**
     * Danh sách quy tắc tích điểm để chọn khi gắn cho hạng.
     * Đăng ký route này TRƯỚC route /hang-thanh-vien/{ma}.
     */
    public function tuyChon(Request $request)
    {
        // Mỗi quy tắc chỉ được gán cho MỘT hạng. Khi sửa hạng nào thì
        // vẫn giữ lại quy tắc của chính hạng đó trong danh sách.
        $maHangHienTai = $request->query('ma_hang');

        $daDung = DB::table('hangthanhvien')
            ->whereNotNull('MaQuyTac')
            ->when($maHangHienTai, fn ($q) => $q->where('MaHangThanhVien', '!=', $maHangHienTai))
            ->pluck('MaQuyTac')
            ->all();

        $quyTac = DB::table('quytactichdiem')
            ->select('MaQuyTac', 'SoTienQuyDoi', 'SoDiemNhan', 'TrangThai')
            ->whereNotIn('MaQuyTac', $daDung)
            ->orderBy('MaQuyTac')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ['quyTac' => $quyTac],
        ]);
    }

    /**
     * Quy tắc đã được hạng khác sử dụng chưa.
     * $boQua: mã hạng đang sửa (không tính chính nó).
     */
    private function quyTacDaDung(string $maQuyTac, ?string $boQua = null): bool
    {
        return HangThanhVien::where('MaQuyTac', $maQuyTac)
            ->when($boQua, fn ($q) => $q->where('MaHangThanhVien', '!=', $boQua))
            ->exists();
    }

    /**
     * Danh sách hạng (tìm + phân trang), sắp theo thứ tự hạng.
     */
    public function index(Request $request)
    {
        $query = HangThanhVien::query();

        if ($kw = trim((string) $request->query('search'))) {
            $query->where(function ($sub) use ($kw) {
                $sub->where('TenHang', 'like', "%{$kw}%")
                    ->orWhere('MaHangThanhVien', 'like', "%{$kw}%");
            });
        }

        $query->orderBy('ThuTuHang');

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
        $htv = HangThanhVien::find($ma);

        if (!$htv) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hạng'], 404);
        }

        return response()->json(['success' => true, 'data' => $htv]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        if ($this->quyTacDaDung($data['MaQuyTac'])) {
            return response()->json([
                'success' => false,
                'message' => 'Quy tắc tích điểm này đã được gán cho một hạng khác.',
            ], 422);
        }

        $last = HangThanhVien::orderBy('MaHangThanhVien', 'desc')->first();
        $so   = $last ? ((int) substr($last->MaHangThanhVien, 3)) + 1 : 1;
        $maHTV = 'HTV' . str_pad($so, 3, '0', STR_PAD_LEFT);

        $htv = new HangThanhVien();
        $htv->MaHangThanhVien    = $maHTV;
        $htv->TenHang            = $data['TenHang'];
        $htv->MoTa               = $data['MoTa'] ?? null;
        $htv->TongChiTieuToiThieu = $data['TongChiTieuToiThieu'];
        $htv->DiemToiThieu       = $data['DiemToiThieu'];
        $htv->ThuTuHang          = $data['ThuTuHang'];
        $htv->MaQuyTac           = $data['MaQuyTac'];
        $htv->save();

        return response()->json([
            'success' => true,
            'message' => 'Thêm hạng thành viên thành công',
            'data'    => $htv,
        ], 201);
    }

    public function update(Request $request, string $ma)
    {
        $htv = HangThanhVien::find($ma);

        if (!$htv) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hạng'], 404);
        }

        $data = $this->validateData($request);

        if ($this->quyTacDaDung($data['MaQuyTac'], $ma)) {
            return response()->json([
                'success' => false,
                'message' => 'Quy tắc tích điểm này đã được gán cho một hạng khác.',
            ], 422);
        }

        $htv->TenHang            = $data['TenHang'];
        $htv->MoTa               = $data['MoTa'] ?? null;
        $htv->TongChiTieuToiThieu = $data['TongChiTieuToiThieu'];
        $htv->DiemToiThieu       = $data['DiemToiThieu'];
        $htv->ThuTuHang          = $data['ThuTuHang'];
        $htv->MaQuyTac           = $data['MaQuyTac'];
        $htv->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hạng thành viên thành công',
            'data'    => $htv,
        ]);
    }

    /**
     * Xóa hạng — chỉ khi chưa có khách hàng nào thuộc hạng này.
     */
    public function destroy(string $ma)
    {
        $htv = HangThanhVien::find($ma);

        if (!$htv) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hạng'], 404);
        }

        // Chặn trước cho thông báo thân thiện (thay vì để FK RESTRICT văng lỗi)
        $coKhach = DB::table('khachhang')->where('MaHangThanhVien', $ma)->exists();
        if ($coKhach) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa: đang có khách hàng thuộc hạng này.',
            ], 409);
        }

        try {
            $htv->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa: hạng đang được sử dụng bởi dữ liệu khác.',
            ], 409);
        }

        return response()->json(['success' => true, 'message' => 'Đã xóa hạng thành viên']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'TenHang'             => ['required', 'string', 'max:50'],
            'MoTa'                => ['nullable', 'string', 'max:255'],
            'TongChiTieuToiThieu' => ['required', 'numeric', 'min:0'],
            'DiemToiThieu'        => ['required', 'integer', 'min:0'],
            'ThuTuHang'           => ['required', 'integer', 'min:1'],
            'MaQuyTac'            => ['required', 'exists:quytactichdiem,MaQuyTac'],
        ]);
    }
}