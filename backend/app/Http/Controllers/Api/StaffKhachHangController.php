<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\PhoneVerificationException;
use App\Http\Controllers\Controller;
use App\Models\HangThanhVien;
use App\Models\KhachHang;
use App\Services\FirebasePhoneAuthService;
use App\Services\PhoneNumberService;
use App\Services\SequentialCodeService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * Nhân viên đăng ký tài khoản HỘ khách hàng tại quầy. Khách hàng vẫn
 * PHẢI tự nhập đúng OTP gửi tới số điện thoại của mình qua Firebase —
 * nhân viên không thể bỏ qua bước này, không nhìn thấy password hash,
 * và không nhận được OTP từ API Laravel (OTP hoàn toàn do Firebase quản
 * lý, không đi qua backend).
 */
class StaffKhachHangController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes,
        private FirebasePhoneAuthService $firebasePhoneAuth,
        private PhoneNumberService $phoneNumbers,
    ) {}

    public function checkPhone(Request $request): JsonResponse
    {
        $request->validate(['SoDienThoai' => ['required', 'string']]);

        $normalized = $this->phoneNumbers->normalize($request->string('SoDienThoai'));
        if ($normalized === null) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại không hợp lệ.',
            ], 422);
        }

        $exists = KhachHang::where('SoDienThoai', $normalized)->exists();

        return response()->json([
            'success' => true,
            'available' => !$exists,
            'message' => $exists ? 'Số điện thoại này đã được đăng ký.' : 'Số điện thoại có thể đăng ký.',
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $nhanVien = auth('nhanvien')->user();

        $request->validate(
            [
                'HoTen' => ['required', 'min:3', 'max:100', 'regex:/^[\pL\s]+$/u'],
                'SoDienThoai' => ['required', 'string'],
                'NgaySinh' => ['required', 'date', 'before:today'],
                'GioiTinh' => ['required', 'in:Nam,Nu'],
                'FirebaseIdToken' => ['required', 'string'],
            ],
            [
                'HoTen.required' => 'Họ tên không được để trống.',
                'HoTen.min' => 'Họ tên phải từ 3 ký tự.',
                'HoTen.max' => 'Họ tên không quá 100 ký tự.',
                'HoTen.regex' => 'Họ tên không hợp lệ.',
                'SoDienThoai.required' => 'Số điện thoại không được để trống.',
                'NgaySinh.required' => 'Ngày sinh không được để trống.',
                'NgaySinh.before' => 'Ngày sinh không hợp lệ.',
                'GioiTinh.required' => 'Vui lòng chọn giới tính.',
                'FirebaseIdToken.required' => 'Khách hàng chưa xác minh mã OTP.',
            ]
        );

        $normalizedPhone = $this->phoneNumbers->normalize($request->string('SoDienThoai'));
        if ($normalizedPhone === null) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại không hợp lệ.',
                'errors' => ['SoDienThoai' => ['Số điện thoại không hợp lệ.']],
            ], 422);
        }

        if (KhachHang::where('SoDienThoai', $normalizedPhone)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại này đã được đăng ký.',
                'errors' => ['SoDienThoai' => ['Số điện thoại này đã được đăng ký.']],
            ], 422);
        }

        // Bắt buộc token khớp đúng số điện thoại nhân viên vừa nhập -> nhân
        // viên không thể gõ một số điện thoại khác với số đã thực sự nhận
        // và xác minh OTP.
        try {
            $verifiedPhone = $this->firebasePhoneAuth->verifyMatches($request->string('FirebaseIdToken'), $normalizedPhone);
        } catch (PhoneVerificationException $e) {
            return response()->json([
                'success' => false,
                'message' => match ($e->reason) {
                    PhoneVerificationException::PHONE_MISMATCH =>
                        'Số điện thoại khách hàng xác minh không khớp với số vừa nhập.',
                    PhoneVerificationException::EXPIRED_TOKEN =>
                        'Phiên xác minh đã hết hạn. Vui lòng gửi lại mã OTP cho khách hàng.',
                    default => 'Chưa xác minh được OTP của khách hàng. Vui lòng thử lại.',
                },
            ], 422);
        }

        $defaultRank = HangThanhVien::query()
            ->orderBy('ThuTuHang')
            ->orderBy('DiemToiThieu')
            ->value('MaHangThanhVien');

        if (!$defaultRank) {
            return response()->json([
                'success' => false,
                'message' => 'Hệ thống chưa cấu hình hạng thành viên mặc định.',
            ], 503);
        }

        try {
            $khachHang = DB::transaction(function () use ($request, $defaultRank, $normalizedPhone, $verifiedPhone, $nhanVien) {
                if (KhachHang::where('SoDienThoai', $normalizedPhone)->lockForUpdate()->exists()) {
                    throw new \RuntimeException('PHONE_ALREADY_REGISTERED');
                }

                return KhachHang::create([
                    'MaKhachHang' => $this->codes->next('khachhang', 'MaKhachHang', 'KH'),
                    'HoTen' => trim($request->HoTen),
                    'SoDienThoai' => $normalizedPhone,
                    'NgaySinh' => $request->NgaySinh,
                    'GioiTinh' => $request->GioiTinh,
                    'MatKhau' => Hash::make($normalizedPhone),
                    'TongDiem' => 0,
                    'MaHangThanhVien' => $defaultRank,
                    'phone_verified_at' => now(),
                    'firebase_uid' => $verifiedPhone->firebaseUid,
                    'created_by_employee_id' => $nhanVien->MaNhanVien,
                ]);
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'PHONE_ALREADY_REGISTERED') {
                return response()->json([
                    'success' => false,
                    'message' => 'Số điện thoại này đã được đăng ký.',
                    'errors' => ['SoDienThoai' => ['Số điện thoại này đã được đăng ký.']],
                ], 422);
            }
            throw $e;
        } catch (QueryException $e) {
            if ((string) $e->getCode() === '23000') {
                return response()->json([
                    'success' => false,
                    'message' => 'Số điện thoại này đã được đăng ký.',
                    'errors' => ['SoDienThoai' => ['Số điện thoại này đã được đăng ký.']],
                ], 422);
            }
            throw $e;
        }

        Log::info('Nhân viên đăng ký hộ tài khoản khách hàng', [
            'ma_khach_hang' => $khachHang->MaKhachHang,
            'ma_nhan_vien' => $nhanVien->MaNhanVien,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản cho khách hàng thành công.',
            'data' => $khachHang->makeHidden('MatKhau'),
        ]);
    }
}
