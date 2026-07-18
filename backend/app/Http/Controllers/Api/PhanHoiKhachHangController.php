<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PhanHoiKhachHang;
use App\Models\HoaDon;
use App\Services\SequentialCodeService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PhanHoiKhachHangController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    /**
     * Lấy phản hồi của hóa đơn
     * Chỉ trả về nếu hóa đơn thuộc về khách hàng đang đăng nhập.
     */
    public function show($maHoaDon)
    {
        $khachHang = auth('khachhang')->user();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không xác thực được người dùng.'
            ], 401);
        }

        $feedback = PhanHoiKhachHang::where('MaHoaDon', $maHoaDon)
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->first();

        if (!$feedback) {
            return response()->json([
                'success' => true,
                'data' => null
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $feedback
        ]);
    }

    /**
     * Khách gửi đánh giá
     */
    public function store(Request $request, $maHoaDon)
    {
        $request->validate([
            'DiemDanhGia' => 'required|integer|min:1|max:5',
            'NoiDungCuaKhachHang' => 'required|string|max:1000',
        ]);

        $khachHang = auth('khachhang')->user();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không xác thực được người dùng.'
            ], 401);
        }

        // Kiểm tra hóa đơn có tồn tại và thuộc về khách hàng đang đăng nhập không
        // Lưu ý: đổi tên Model/khóa cho đúng với hệ thống của bạn nếu khác 'HoaDon' / 'MaKhachHang'
        $invoice = HoaDon::where('MaHoaDon', $maHoaDon)
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'DaThanhToan')
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Hóa đơn không hợp lệ hoặc không thuộc về bạn.'
            ], 404);
        }

        // Kiểm tra đã đánh giá chưa
        $exists = PhanHoiKhachHang::where('MaHoaDon', $maHoaDon)
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Hóa đơn này đã được đánh giá.'
            ], 422);
        }

        // Sinh mã PH001 và tạo feedback trong 1 transaction có khóa dòng
        // để tránh 2 request cùng lúc sinh trùng mã (race condition)
        $feedback = DB::transaction(function () use ($request, $khachHang, $maHoaDon) {
            $lockedInvoice = HoaDon::where('MaHoaDon', $maHoaDon)
                ->where('MaKhachHang', $khachHang->MaKhachHang)
                ->where('TrangThai', 'DaThanhToan')
                ->lockForUpdate()
                ->first();

            if (!$lockedInvoice) {
                throw ValidationException::withMessages([
                    'MaHoaDon' => ['Hóa đơn không hợp lệ hoặc chưa thanh toán.'],
                ]);
            }

            $alreadyExists = PhanHoiKhachHang::where('MaHoaDon', $maHoaDon)
                ->where('MaKhachHang', $khachHang->MaKhachHang)
                ->lockForUpdate()
                ->exists();

            if ($alreadyExists) {
                throw ValidationException::withMessages([
                    'MaHoaDon' => ['Hóa đơn này đã được đánh giá.'],
                ]);
            }

            return PhanHoiKhachHang::create([
                'MaPhanHoi' => $this->codes->next(
                    'phanhoikhachhang',
                    'MaPhanHoi',
                    'PH'
                ),
                'DiemDanhGia' => $request->DiemDanhGia,
                'NoiDungCuaKhachHang' => $request->NoiDungCuaKhachHang,
                'ThoiGian' => now(),

                'MaKhachHang' => $khachHang->MaKhachHang,
                'MaHoaDon' => $maHoaDon,

                'TrangThaiXuLy' => 'ChuaXuLy',

                'NoiDungPhanHoiCuaHang' => null,
                'ThoiGianPhanHoi' => null,
                'MaNhanVien' => null,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Đánh giá thành công.',
            'data' => $feedback
        ]);
    }
}
