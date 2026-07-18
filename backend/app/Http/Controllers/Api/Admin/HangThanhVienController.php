<?php
// app/Http/Controllers/Api/Admin/HangThanhVienController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HangThanhVien;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HangThanhVienController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    /**
     * Danh sách quy tắc tích điểm để chọn khi gắn cho hạng.
     * Đăng ký route này TRƯỚC route /hang-thanh-vien/{ma}.
     */
    public function tuyChon()
    {
        $quyTac = DB::table('quytactichdiem')
            ->select('MaQuyTac', 'SoTienQuyDoi', 'SoDiemNhan', 'TrangThai')
            ->orderBy('MaQuyTac')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ['quyTac' => $quyTac],
        ]);
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

        $htv = DB::transaction(function () use ($data) {
            HangThanhVien::orderBy('ThuTuHang')->lockForUpdate()->get();
            $this->assertLogicalThresholds($data);

            $htv = new HangThanhVien();
            $htv->MaHangThanhVien = $this->codes->next(
                'hangthanhvien',
                'MaHangThanhVien',
                'HTV'
            );
            $htv->TenHang             = $data['TenHang'];
            $htv->MoTa                = $data['MoTa'] ?? null;
            $htv->TongChiTieuToiThieu = $data['TongChiTieuToiThieu'];
            $htv->DiemToiThieu        = $data['DiemToiThieu'];
            $htv->ThuTuHang           = $data['ThuTuHang'];
            $htv->MaQuyTac            = $data['MaQuyTac'];
            $htv->save();

            return $htv;
        });

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

        $data = $this->validateData($request, $ma);

        $htv = DB::transaction(function () use ($data, $ma) {
            HangThanhVien::orderBy('ThuTuHang')->lockForUpdate()->get();
            $htv = HangThanhVien::where('MaHangThanhVien', $ma)->lockForUpdate()->first();
            if (!$htv) return null;

            $this->assertLogicalThresholds($data, $ma);
            $htv->TenHang = trim($data['TenHang']);
            $htv->MoTa = $data['MoTa'] ?? null;
            $htv->TongChiTieuToiThieu = $data['TongChiTieuToiThieu'];
            $htv->DiemToiThieu = $data['DiemToiThieu'];
            $htv->ThuTuHang = $data['ThuTuHang'];
            $htv->MaQuyTac = $data['MaQuyTac'];
            $htv->save();

            return $htv;
        });

        if (!$htv) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hạng'], 404);
        }

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

        if (HangThanhVien::count() <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Hệ thống phải luôn có ít nhất một hạng thành viên.',
            ], 409);
        }

        $lowestRankId = HangThanhVien::orderBy('ThuTuHang')
            ->orderBy('DiemToiThieu')
            ->value('MaHangThanhVien');
        if ($lowestRankId === $ma) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa hạng mặc định thấp nhất của hệ thống.',
            ], 409);
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

    private function validateData(Request $request, ?string $ignoreId = null): array
    {
        return $request->validate([
            'TenHang'             => [
                'required',
                'string',
                'max:50',
                Rule::unique('hangthanhvien', 'TenHang')
                    ->ignore($ignoreId, 'MaHangThanhVien'),
            ],
            'MoTa'                => ['nullable', 'string', 'max:255'],
            'TongChiTieuToiThieu' => ['required', 'numeric', 'min:0'],
            'DiemToiThieu'        => ['required', 'integer', 'min:0'],
            'ThuTuHang'           => [
                'required',
                'integer',
                'min:1',
                Rule::unique('hangthanhvien', 'ThuTuHang')
                    ->ignore($ignoreId, 'MaHangThanhVien'),
            ],
            'MaQuyTac'            => ['required', 'exists:quytactichdiem,MaQuyTac'],
        ]);
    }

    private function assertLogicalThresholds(array $data, ?string $ignoreId = null): void
    {
        $baseQuery = HangThanhVien::query()
            ->when($ignoreId, fn ($query) => $query->where('MaHangThanhVien', '!=', $ignoreId));

        $previous = (clone $baseQuery)
            ->where('ThuTuHang', '<', $data['ThuTuHang'])
            ->orderByDesc('ThuTuHang')
            ->first();
        $next = (clone $baseQuery)
            ->where('ThuTuHang', '>', $data['ThuTuHang'])
            ->orderBy('ThuTuHang')
            ->first();

        $errors = [];
        if (
            !$previous
            && (
                (int) $data['DiemToiThieu'] !== 0
                || (float) $data['TongChiTieuToiThieu'] !== 0.0
            )
        ) {
            $errors['DiemToiThieu'][] = 'Hạng thấp nhất phải bắt đầu từ 0 điểm và 0 đồng chi tiêu.';
            $errors['TongChiTieuToiThieu'][] = 'Hạng thấp nhất phải bắt đầu từ 0 điểm và 0 đồng chi tiêu.';
        }
        if ($previous && (int) $data['DiemToiThieu'] <= (int) $previous->DiemToiThieu) {
            $errors['DiemToiThieu'][] = 'Điểm tối thiểu phải lớn hơn hạng đứng trước.';
        }
        if ($next && (int) $data['DiemToiThieu'] >= (int) $next->DiemToiThieu) {
            $errors['DiemToiThieu'][] = 'Điểm tối thiểu phải nhỏ hơn hạng đứng sau.';
        }
        if (
            $previous
            && (float) $data['TongChiTieuToiThieu'] <= (float) $previous->TongChiTieuToiThieu
        ) {
            $errors['TongChiTieuToiThieu'][] = 'Chi tiêu tối thiểu phải lớn hơn hạng đứng trước.';
        }
        if (
            $next
            && (float) $data['TongChiTieuToiThieu'] >= (float) $next->TongChiTieuToiThieu
        ) {
            $errors['TongChiTieuToiThieu'][] = 'Chi tiêu tối thiểu phải nhỏ hơn hạng đứng sau.';
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }
}
