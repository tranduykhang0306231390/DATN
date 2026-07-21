<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\PhoneVerificationException;
use App\Http\Controllers\Controller;
use App\Models\HangThanhVien;
use App\Models\KhachHang;
use App\Models\NhanVien;
use App\Services\CustomerActionTokenService;
use App\Services\FirebasePhoneAuthService;
use App\Services\PhoneNumberService;
use App\Services\SequentialCodeService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Quy tắc mật khẩu hiện tại của dự án (giữ nguyên, không tự tạo chuẩn mới):
 * 8-20 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*#?&).
 */
class AuthController extends Controller
{
    private const PASSWORD_RULES = [
        'required',
        'string',
        'min:8',
        'max:20',
        'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).+$/',
    ];

    private const PASSWORD_MESSAGES = [
        'MatKhau.min' => 'Mật khẩu phải từ 8 ký tự.',
        'MatKhau.max' => 'Mật khẩu tối đa 20 ký tự.',
        'MatKhau.regex' => 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.',
        'MatKhauMoi.min' => 'Mật khẩu mới phải từ 8 ký tự.',
        'MatKhauMoi.max' => 'Mật khẩu mới tối đa 20 ký tự.',
        'MatKhauMoi.regex' => 'Mật khẩu mới phải có chữ hoa, chữ thường, số và ký tự đặc biệt.',
    ];

    public function __construct(
        private CustomerActionTokenService $actionTokens,
        private SequentialCodeService $codes,
        private FirebasePhoneAuthService $firebasePhoneAuth,
        private PhoneNumberService $phoneNumbers,
    ) {}

    /*
    |--------------------------------------------------------------------------
    | Đăng ký khách hàng (tự đăng ký)
    |--------------------------------------------------------------------------
    */

    /**
     * Kiểm tra số điện thoại hợp lệ và chưa được đăng ký, TRƯỚC khi
     * frontend bắt đầu luồng gửi OTP Firebase (tránh gửi OTP tốn phí cho
     * một số điện thoại chắc chắn sẽ bị từ chối ở bước cuối).
     */
    public function checkPhoneAvailable(Request $request): JsonResponse
    {
        $request->validate([
            'SoDienThoai' => ['required', 'string'],
        ]);

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

    /**
     * Hoàn tất đăng ký: chỉ tạo tài khoản khách hàng SAU KHI Firebase ID
     * Token đã được xác minh khớp đúng số điện thoại vừa nhập.
     */
    public function register(Request $request): JsonResponse
    {
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
                'FirebaseIdToken.required' => 'Thiếu thông tin xác minh số điện thoại.',
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

        try {
            $verifiedPhone = $this->firebasePhoneAuth->verifyMatches(
                $request->string('FirebaseIdToken'),
                $normalizedPhone,
            );
        } catch (PhoneVerificationException $e) {
            return $this->phoneVerificationErrorResponse($e);
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
            $khachHang = DB::transaction(function () use ($request, $defaultRank, $normalizedPhone, $verifiedPhone) {
                // Kiểm tra lại lần cuối bên trong transaction để chống race
                // condition khi hai request đăng ký cùng số điện thoại chạy
                // đồng thời. Lớp bảo vệ cuối cùng vẫn là unique index ở DB.
                if (KhachHang::where('SoDienThoai', $normalizedPhone)->lockForUpdate()->exists()) {
                    throw new \RuntimeException('PHONE_ALREADY_REGISTERED');
                }

                return KhachHang::create([
                    'MaKhachHang' => $this->codes->next('khachhang', 'MaKhachHang', 'KH'),
                    'HoTen' => trim($request->HoTen),
                    'SoDienThoai' => $normalizedPhone,
                    'NgaySinh' => $request->NgaySinh,
                    'GioiTinh' => $request->GioiTinh,
                    // Mật khẩu mặc định = chính số điện thoại đã chuẩn hóa,
                    // LUÔN được hash. Đây chỉ là giá trị khởi tạo — khách
                    // hàng đổi mật khẩu bất cứ lúc nào sau khi đăng nhập.
                    'MatKhau' => Hash::make($normalizedPhone),
                    'TongDiem' => 0,
                    'MaHangThanhVien' => $defaultRank,
                    'phone_verified_at' => now(),
                    'firebase_uid' => $verifiedPhone->firebaseUid,
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

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công. Bạn có thể đăng nhập bằng số điện thoại và chính số điện thoại đó làm mật khẩu ban đầu.',
            'user' => $khachHang,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Đăng nhập khách hàng
    |--------------------------------------------------------------------------
    */

    public function memberLogin(Request $request): JsonResponse
    {
        $request->validate(
            [
                'SoDienThoai' => ['required', 'string'],
                'MatKhau' => ['required', 'min:6'],
            ],
            [
                'SoDienThoai.required' => 'Vui lòng nhập số điện thoại.',
                'MatKhau.required' => 'Vui lòng nhập mật khẩu.',
                'MatKhau.min' => 'Mật khẩu tối thiểu 6 ký tự.',
            ]
        );

        $normalizedPhone = $this->phoneNumbers->normalize($request->string('SoDienThoai'));

        $khachHang = $normalizedPhone !== null
            ? KhachHang::where('SoDienThoai', $normalizedPhone)->first()
            : null;

        if (!$khachHang || !Hash::check($request->MatKhau, $khachHang->MatKhau)) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại hoặc mật khẩu không đúng.',
            ], 401);
        }

        if ($khachHang->TrangThai !== 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đã bị khóa.',
            ], 403);
        }

        $token = JWTAuth::fromUser($khachHang);

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập khách hàng thành công',
            'token' => $token,
            'role' => 'member',
            'user' => $khachHang,
        ]);
    }

    /**
     * Đăng nhập bằng Firebase Phone OTP (không cần mật khẩu). Số điện
     * thoại được LẤY TỪ Firebase ID Token đã xác minh, không phải từ
     * trường nào khác trong request.
     */
    public function loginFirebase(Request $request): JsonResponse
    {
        $request->validate(
            ['FirebaseIdToken' => ['required', 'string']],
            ['FirebaseIdToken.required' => 'Thiếu thông tin xác minh số điện thoại.']
        );

        try {
            $verifiedPhone = $this->firebasePhoneAuth->verify($request->string('FirebaseIdToken'));
        } catch (PhoneVerificationException $e) {
            return $this->phoneVerificationErrorResponse($e);
        }

        $khachHang = KhachHang::where('SoDienThoai', $verifiedPhone->phoneInStorageFormat)->first();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại này chưa có tài khoản. Vui lòng đăng ký trước.',
            ], 404);
        }

        if ($khachHang->TrangThai !== 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đã bị khóa.',
            ], 403);
        }

        // Đăng nhập OTP thành công tự chứng minh khách đang sở hữu số điện
        // thoại ngay lúc này -> có thể cập nhật phone_verified_at/firebase_uid
        // nếu trước đó chưa có (ví dụ khách hàng cũ được migrate dữ liệu).
        if (!$khachHang->hasVerifiedPhone() || $khachHang->firebase_uid !== $verifiedPhone->firebaseUid) {
            $khachHang->phone_verified_at ??= now();
            $khachHang->firebase_uid = $verifiedPhone->firebaseUid;
            $khachHang->save();
        }

        $token = JWTAuth::fromUser($khachHang);

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập khách hàng thành công',
            'token' => $token,
            'role' => 'member',
            'user' => $khachHang,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Hồ sơ khách hàng
    |--------------------------------------------------------------------------
    */

    public function memberProfile(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => auth('khachhang')->user(),
        ]);
    }

    /**
     * Cập nhật hồ sơ khách hàng. KHÔNG cho tự đổi SoDienThoai ở đây vì đó
     * là tài khoản đăng nhập (đã được Firebase xác minh lúc đăng ký) — đổi
     * số điện thoại cần một luồng xác minh OTP riêng, ngoài phạm vi hiện tại.
     * Không còn cột Email trên bảng khachhang (đã loại bỏ hoàn toàn khỏi
     * danh tính/hồ sơ khách hàng).
     */
    public function updateMemberProfile(Request $request): JsonResponse
    {
        $khachHang = auth('khachhang')->user();

        $data = $request->validate(
            [
                'HoTen' => ['required', 'min:3', 'max:100', 'regex:/^[\pL\s]+$/u'],
                'NgaySinh' => ['required', 'date', 'before:today'],
                'GioiTinh' => ['required', 'in:Nam,Nu,Nữ'],
            ],
            [
                'HoTen.required' => 'Họ tên không được để trống.',
                'NgaySinh.required' => 'Ngày sinh không được để trống.',
                'GioiTinh.required' => 'Vui lòng chọn giới tính.',
            ]
        );

        $khachHang->update([
            'HoTen' => trim((string) $data['HoTen']),
            'NgaySinh' => $data['NgaySinh'],
            'GioiTinh' => $data['GioiTinh'] === 'Nữ' ? 'Nu' : $data['GioiTinh'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin thành công',
            'user' => $khachHang->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Quên mật khẩu (Firebase OTP)
    |--------------------------------------------------------------------------
    */

    /**
     * Bước 1: khách hàng đã xác minh sở hữu số điện thoại qua Firebase.
     * Cấp reset token ngắn hạn, dùng một lần.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(
            [
                'SoDienThoai' => ['required', 'string'],
                'FirebaseIdToken' => ['required', 'string'],
            ],
            [
                'SoDienThoai.required' => 'Vui lòng nhập số điện thoại.',
                'FirebaseIdToken.required' => 'Thiếu thông tin xác minh số điện thoại.',
            ]
        );

        $normalizedPhone = $this->phoneNumbers->normalize($request->string('SoDienThoai'));
        if ($normalizedPhone === null) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại không hợp lệ.',
            ], 422);
        }

        try {
            $this->firebasePhoneAuth->verifyMatches($request->string('FirebaseIdToken'), $normalizedPhone);
        } catch (PhoneVerificationException $e) {
            return $this->phoneVerificationErrorResponse($e);
        }

        // Đến đây, người gọi ĐÃ chứng minh (qua Firebase OTP) rằng họ thực
        // sự đang cầm số điện thoại này ngay lúc này — vì vậy trả lời rõ
        // ràng "chưa có tài khoản" ở bước này không làm lộ thông tin cho
        // người không sở hữu số điện thoại (họ không thể vượt qua bước
        // xác minh OTP để tới được đây).
        $khachHang = KhachHang::where('SoDienThoai', $normalizedPhone)->first();
        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại này chưa có tài khoản.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Xác thực thành công.',
            'reset_token' => $this->actionTokens->create($khachHang, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD),
            'expires_in' => CustomerActionTokenService::TTL_MINUTES * 60,
        ]);
    }

    /**
     * Bước 2: đặt mật khẩu mới bằng reset token đã cấp ở bước 1.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate(
            array_merge(
                [
                    'SoDienThoai' => ['required', 'string'],
                    'ResetToken' => ['required', 'string', 'max:255'],
                    'MatKhau' => self::PASSWORD_RULES,
                    'MatKhau_confirmation' => ['required', 'same:MatKhau'],
                ],
            ),
            self::PASSWORD_MESSAGES
        );

        $normalizedPhone = $this->phoneNumbers->normalize($request->string('SoDienThoai'));
        if ($normalizedPhone === null) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại không hợp lệ.',
            ], 422);
        }

        $resetResult = DB::transaction(function () use ($request, $normalizedPhone) {
            $khachHang = KhachHang::where('SoDienThoai', $normalizedPhone)
                ->lockForUpdate()
                ->first();

            if (!$khachHang) {
                return 'customer_not_found';
            }

            if (!$this->actionTokens->consume(
                $request->string('ResetToken'),
                $khachHang,
                CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD,
            )) {
                return 'invalid_token';
            }

            if (Hash::check($request->MatKhau, $khachHang->MatKhau)) {
                return 'same_password';
            }

            // Ghi đè bằng hash của mật khẩu MỚI. Từ đây trở đi, mật khẩu
            // mặc định (số điện thoại) không còn dùng đăng nhập được nữa.
            $khachHang->MatKhau = Hash::make($request->MatKhau);
            $khachHang->save();

            return 'changed';
        });

        return match ($resetResult) {
            'customer_not_found' => response()->json([
                'success' => false,
                'message' => 'Thông tin không đúng.',
            ], 404),
            'invalid_token' => response()->json([
                'success' => false,
                'message' => 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
            ], 422),
            'same_password' => response()->json([
                'success' => false,
                'message' => 'Mật khẩu mới không được trùng mật khẩu hiện tại.',
            ], 422),
            default => response()->json([
                'success' => true,
                'message' => 'Đổi mật khẩu thành công.',
            ]),
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Đổi mật khẩu (khách hàng đang đăng nhập, xác minh lại qua Firebase OTP)
    |--------------------------------------------------------------------------
    */

    /**
     * Bước 1: khách hàng ĐANG ĐĂNG NHẬP xác minh lại quyền sở hữu chính
     * số điện thoại của tài khoản mình qua Firebase OTP. Không tin tưởng
     * bất kỳ số điện thoại nào frontend gửi lên — luôn dùng số điện thoại
     * của $khachHang lấy từ token đăng nhập hiện tại.
     */
    public function changePasswordRequestVerification(Request $request): JsonResponse
    {
        $khachHang = auth('khachhang')->user();

        $request->validate(
            ['FirebaseIdToken' => ['required', 'string']],
            ['FirebaseIdToken.required' => 'Thiếu thông tin xác minh số điện thoại.']
        );

        try {
            $this->firebasePhoneAuth->verifyMatches($request->string('FirebaseIdToken'), $khachHang->SoDienThoai);
        } catch (PhoneVerificationException $e) {
            return $this->phoneVerificationErrorResponse($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Xác thực thành công.',
            'change_token' => $this->actionTokens->create($khachHang, CustomerActionTokenService::PURPOSE_CHANGE_PASSWORD),
            'expires_in' => CustomerActionTokenService::TTL_MINUTES * 60,
        ]);
    }

    /**
     * Bước 2: xác nhận mật khẩu mới bằng change token đã cấp ở bước 1.
     */
    public function changePasswordConfirm(Request $request): JsonResponse
    {
        $khachHang = auth('khachhang')->user();

        $request->validate(
            [
                'ChangeToken' => ['required', 'string', 'max:255'],
                'MatKhauMoi' => self::PASSWORD_RULES,
                'MatKhauMoi_confirmation' => ['required', 'same:MatKhauMoi'],
            ],
            self::PASSWORD_MESSAGES
        );

        $changeResult = DB::transaction(function () use ($request, $khachHang) {
            $lockedCustomer = KhachHang::where('MaKhachHang', $khachHang->MaKhachHang)
                ->lockForUpdate()
                ->first();

            if (!$this->actionTokens->consume(
                $request->string('ChangeToken'),
                $lockedCustomer,
                CustomerActionTokenService::PURPOSE_CHANGE_PASSWORD,
            )) {
                return 'invalid_token';
            }

            if (Hash::check($request->MatKhauMoi, $lockedCustomer->MatKhau)) {
                return 'same_password';
            }

            // Ghi đè hash cũ (dù đang là hash của số điện thoại mặc định
            // hay của một mật khẩu đã đổi trước đó) bằng hash mật khẩu mới.
            $lockedCustomer->MatKhau = Hash::make($request->MatKhauMoi);
            $lockedCustomer->save();

            return 'changed';
        });

        if ($changeResult === 'invalid_token') {
            return response()->json([
                'success' => false,
                'message' => 'Phiên xác thực đổi mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng xác minh lại OTP.',
            ], 422);
        }

        if ($changeResult === 'same_password') {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu mới không được trùng mật khẩu hiện tại.',
                'errors' => ['MatKhauMoi' => ['Mật khẩu mới không được trùng mật khẩu hiện tại.']],
            ], 422);
        }

        // password_fingerprint trong JWT đổi theo hash mật khẩu -> token cũ
        // (kể cả trên các thiết bị khác) sẽ tự động bị middleware từ chối.
        // Cấp lại token mới cho phiên hiện tại để không bị đăng xuất luôn.
        $freshCustomer = KhachHang::findOrFail($khachHang->MaKhachHang);
        $newToken = JWTAuth::fromUser($freshCustomer);

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.',
            'token' => $newToken,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Nhân viên / Admin (KHÔNG thay đổi cơ chế đăng nhập của staff)
    |--------------------------------------------------------------------------
    */

    public function staffLogin(Request $request): JsonResponse
    {
        $request->validate(
            [
                'username' => 'required',
                'password' => 'required|min:6',
            ],
            [
                'username.required' => 'Vui lòng nhập tên đăng nhập.',
                'password.required' => 'Vui lòng nhập mật khẩu.',
            ]
        );

        $nhanVien = NhanVien::where('TenDangNhap', trim((string) $request->username))->first();
        if (!$nhanVien) {
            return response()->json([
                'success' => false,
                'message' => 'Tên đăng nhập hoặc mật khẩu không đúng.',
            ], 401);
        }

        if (!Hash::check($request->password, $nhanVien->MatKhau)) {
            return response()->json([
                'success' => false,
                'message' => 'Tên đăng nhập hoặc mật khẩu không đúng.',
            ], 401);
        }
        if ($nhanVien->TrangThai !== 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đã bị khóa.',
            ], 403);
        }

        $token = JWTAuth::fromUser($nhanVien);

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập nhân viên thành công',
            'token' => $token,
            'role' => $nhanVien->VaiTro,
            'user' => $nhanVien,
        ]);
    }

    public function staffProfile(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => auth('nhanvien')->user(),
        ]);
    }

    /**
     * Cho phép nhân viên/admin đang đăng nhập tự cập nhật thông tin tài khoản của mình.
     * Không cho đổi VaiTro hay TrangThai qua đây.
     */
    public function updateStaffProfile(Request $request): JsonResponse
    {
        $nhanVien = auth('nhanvien')->user();

        $data = $request->validate(
            [
                'HoTen' => ['required', 'string', 'max:100'],
                'TenDangNhap' => ['required', 'string', 'max:50', 'unique:nhanvien,TenDangNhap,' . $nhanVien->MaNhanVien . ',MaNhanVien'],
                'MatKhau' => ['nullable', 'string', 'min:6'],
            ],
            [
                'HoTen.required' => 'Họ tên không được để trống.',
                'TenDangNhap.required' => 'Tên đăng nhập không được để trống.',
                'TenDangNhap.unique' => 'Tên đăng nhập đã được sử dụng.',
                'MatKhau.min' => 'Mật khẩu tối thiểu 6 ký tự.',
            ]
        );

        $nhanVien->HoTen = $data['HoTen'];
        $nhanVien->TenDangNhap = $data['TenDangNhap'];
        if (!empty($data['MatKhau'])) {
            $nhanVien->MatKhau = Hash::make($data['MatKhau']);
        }
        $nhanVien->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật tài khoản thành công',
            'user' => $nhanVien->fresh(),
        ]);
    }

    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());

            return response()->json([
                'success' => true,
                'message' => 'Đăng xuất thành công',
            ]);
        } catch (\Exception) {
            return response()->json([
                'success' => false,
                'message' => 'Token không hợp lệ',
            ], 401);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    private function phoneVerificationErrorResponse(PhoneVerificationException $e): JsonResponse
    {
        // Không log OTP/token/số điện thoại — chỉ log lý do (reason code) và
        // thông điệp kỹ thuật của chính exception để chẩn đoán khi cần.
        Log::warning('Xác minh số điện thoại Firebase thất bại', [
            'reason' => $e->reason,
            'technical_message' => $e->getMessage(),
        ]);

        $message = match ($e->reason) {
            PhoneVerificationException::EXPIRED_TOKEN =>
                'Phiên xác minh đã hết hạn. Vui lòng gửi lại mã OTP.',
            PhoneVerificationException::PHONE_MISMATCH =>
                'Số điện thoại xác minh không khớp với số điện thoại bạn đã nhập.',
            PhoneVerificationException::ACCOUNT_DISABLED_OR_REVOKED =>
                'Phiên xác minh không còn hiệu lực. Vui lòng thử lại.',
            default => 'Không thể xác minh số điện thoại. Vui lòng thử lại.',
        };

        return response()->json([
            'success' => false,
            'message' => $message,
        ], 422);
    }
}
