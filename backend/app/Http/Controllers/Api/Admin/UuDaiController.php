<?php
// app/Http/Controllers/Api/Admin/UuDaiController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\UuDai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UuDaiController extends Controller
{
    private const NHOM = ['GiamTien', 'PhanTram', 'TangMon'];

    /**
     * Dữ liệu phụ cho form (danh sách hạng thành viên để chọn).
     * Đăng ký route này TRƯỚC route /uu-dai/{ma}.
     */
    public function tuyChon()
    {
        $hang = DB::table('hangthanhvien')
            ->select('MaHangThanhVien', 'TenHang')
            ->orderBy('ThuTuHang')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ['hangThanhVien' => $hang],
        ]);
    }

    /**
     * Danh sách ưu đãi (tìm kiếm + lọc + phân trang).
     * params: search, trang_thai, nhom, hang, per_page, page
     */
    public function index(Request $request)
    {
        $query = UuDai::query();

        if ($kw = trim((string) $request->query('search'))) {
            $query->where(function ($sub) use ($kw) {
                $sub->where('TenUuDai', 'like', "%{$kw}%")
                    ->orWhere('MaUuDai', 'like', "%{$kw}%");
            });
        }
        if ($tt = $request->query('trang_thai')) {
            $query->where('TrangThai', $tt);
        }
        if ($nhom = $request->query('nhom')) {
            $query->where('NhomUuDai', $nhom);
        }
        if ($hang = $request->query('hang')) {
            $query->where('MaHangThanhVien', $hang);
        }

        $query->orderBy('MaUuDai', 'desc');

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
        $ud = UuDai::find($ma);

        if (!$ud) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy ưu đãi'], 404);
        }

        return response()->json(['success' => true, 'data' => $ud]);
    }

    /**
     * Thêm ưu đãi mới. Số lượng tồn ban đầu = số lượng phát hành.
     */
    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $last = UuDai::orderBy('MaUuDai', 'desc')->first();
        $so   = $last ? ((int) substr($last->MaUuDai, 2)) + 1 : 1;
        $maUD = 'UD' . str_pad($so, 3, '0', STR_PAD_LEFT);

        $ud = new UuDai();
        $ud->MaUuDai         = $maUD;
        $ud->TenUuDai        = $data['TenUuDai'];
        $ud->SoDiemCanDoi    = $data['SoDiemCanDoi'];
        $ud->GiaTriGiam      = $data['GiaTriGiam'];
        $ud->MoTa            = $data['MoTa'] ?? null;
        $ud->SoLuongPhatHanh = $data['SoLuongPhatHanh'];
        $ud->SoLuongTon      = $data['SoLuongPhatHanh']; // ban đầu chưa phát ra voucher nào
        $ud->NgayBatDau      = $data['NgayBatDau'];
        $ud->NgayKetThuc     = $data['NgayKetThuc'];
        $ud->TrangThai       = 'HoatDong';
        $ud->MaHangThanhVien = $data['MaHangThanhVien'] ?: null;
        $ud->NhomUuDai       = $data['NhomUuDai'];
        $ud->CoTheDungChung  = (int) ($data['CoTheDungChung'] ?? 0);
        $ud->ThuTuApDung     = $data['ThuTuApDung'] ?? 1;
        $ud->save();

        return response()->json([
            'success' => true,
            'message' => 'Thêm ưu đãi thành công',
            'data'    => $ud,
        ], 201);
    }

    /**
     * Cập nhật ưu đãi.
     * Khi đổi số lượng phát hành, giữ nguyên số đã phát ra và tính lại tồn kho.
     */
    public function update(Request $request, string $ma)
    {
        $ud = UuDai::find($ma);

        if (!$ud) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy ưu đãi'], 404);
        }

        $data = $this->validateData($request);

        // Số voucher đã phát ra trước đó = phát hành cũ - tồn cũ
        $daPhatRa       = max(0, (int) $ud->SoLuongPhatHanh - (int) $ud->SoLuongTon);
        $newPhatHanh    = (int) $data['SoLuongPhatHanh'];
        $ud->SoLuongTon = max(0, $newPhatHanh - $daPhatRa);

        $ud->TenUuDai        = $data['TenUuDai'];
        $ud->SoDiemCanDoi    = $data['SoDiemCanDoi'];
        $ud->GiaTriGiam      = $data['GiaTriGiam'];
        $ud->MoTa            = $data['MoTa'] ?? null;
        $ud->SoLuongPhatHanh = $newPhatHanh;
        $ud->NgayBatDau      = $data['NgayBatDau'];
        $ud->NgayKetThuc     = $data['NgayKetThuc'];
        $ud->MaHangThanhVien = $data['MaHangThanhVien'] ?: null;
        $ud->NhomUuDai       = $data['NhomUuDai'];
        $ud->CoTheDungChung  = (int) ($data['CoTheDungChung'] ?? 0);
        $ud->ThuTuApDung     = $data['ThuTuApDung'] ?? 1;
        $ud->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật ưu đãi thành công',
            'data'    => $ud,
        ]);
    }

    /**
     * Bật / tắt ưu đãi (HoatDong <-> NgungApDung).
     */
    public function toggleTrangThai(string $ma)
    {
        $ud = UuDai::find($ma);

        if (!$ud) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy ưu đãi'], 404);
        }

        $ud->TrangThai = $ud->TrangThai === 'HoatDong' ? 'NgungApDung' : 'HoatDong';
        $ud->save();

        return response()->json([
            'success' => true,
            'message' => $ud->TrangThai === 'HoatDong' ? 'Đã kích hoạt ưu đãi' : 'Đã ngừng ưu đãi',
            'data'    => $ud,
        ]);
    }

    /**
     * Quy tắc validate dùng chung cho store & update.
     */
    private function validateData(Request $request): array
    {
        $data = $request->validate([
            'TenUuDai'        => ['required', 'string', 'max:100'],
            'NhomUuDai'       => ['required', Rule::in(self::NHOM)],
            'GiaTriGiam'      => ['required', 'numeric', 'min:0'],
            'SoDiemCanDoi'    => ['required', 'integer', 'min:0'],
            'SoLuongPhatHanh' => ['required', 'integer', 'min:0'],
            'NgayBatDau'      => ['required', 'date'],
            'NgayKetThuc'     => ['required', 'date', 'after_or_equal:NgayBatDau'],
            'MaHangThanhVien' => ['nullable', 'exists:hangthanhvien,MaHangThanhVien'],
            'CoTheDungChung'  => ['nullable', 'boolean'],
            'ThuTuApDung'     => ['nullable', 'integer', 'min:1'],
            'MoTa'            => ['nullable', 'string', 'max:255'],
        ]);

        // Ưu đãi phần trăm thì giá trị giảm phải nằm trong 0–100
        if ($data['NhomUuDai'] === 'PhanTram' && $data['GiaTriGiam'] > 100) {
            abort(response()->json([
                'success' => false,
                'message' => 'Ưu đãi phần trăm không được vượt quá 100%',
            ], 422));
        }

        return $data;
    }
}