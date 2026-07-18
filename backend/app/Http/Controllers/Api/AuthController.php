<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KhachHang;
use App\Models\HangThanhVien;
use App\Models\NhanVien;
use App\Services\PasswordResetTokenService;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(
        private PasswordResetTokenService $passwordResetTokens,
        private SequentialCodeService $codes
    ) {}

    public function memberLogin(Request $request)
    {
        $request->validate(
            [
                'email' => 'required|email',
                'password' => 'required|min:6'
            ],
            [
                'email.required' => 'Vui lòng nhập email.',
                'email.email' => 'Email không hợp lệ.',
                'password.required' => 'Vui lòng nhập mật khẩu.',
                'password.min' => 'Mật khẩu tối thiểu 6 ký tự.'
            ]
        );

        $khachHang = KhachHang::where(
            'Email',
            mb_strtolower(trim((string) $request->email))
        )->first();
        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không đúng.'
            ], 401);
        }

        if (!Hash::check($request->password, $khachHang->MatKhau)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không đúng.'
            ], 401);
        }

        // Kiểm tra trạng thái tài khoản
        if ($khachHang->TrangThai !== 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đã bị khóa.'
            ], 403);
        }

        $token = JWTAuth::fromUser($khachHang);

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập khách hàng thành công',
            'token' => $token,
            'role' => 'member',
            'user' => $khachHang
        ]);
    }

    public function staffLogin(Request $request)
    {
        $request->validate(
            [
                'username' => 'required',
                'password' => 'required|min:6'
            ],
            [
                'username.required' => 'Vui lòng nhập tên đăng nhập.',
                'password.required' => 'Vui lòng nhập mật khẩu.',
                'password.min' => 'Mật khẩu tối thiểu 6 ký tự.'
            ]
        );

        $nhanVien = NhanVien::where('TenDangNhap', trim((string) $request->username))->first();
        if (!$nhanVien) {
            return response()->json([
                'success' => false,
                'message' => 'Tên đăng nhập hoặc mật khẩu không đúng.'
            ], 401);
        }

        if (!Hash::check($request->password, $nhanVien->MatKhau)) {
            return response()->json([
                'success' => false,
                'message' => 'Tên đăng nhập hoặc mật khẩu không đúng.'
            ], 401);
        }
        if ($nhanVien->TrangThai !== 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đã bị khóa.'
            ], 403);
        }

        $token = JWTAuth::fromUser($nhanVien);

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập nhân viên thành công',
            'token' => $token,
            'role' => $nhanVien->VaiTro,
            'user' => $nhanVien
        ]);
    }
    public function staffProfile()
    {
        return response()->json([
            'success' => true,
            'user' => auth('nhanvien')->user()
        ]);
    }

    /**
     * Cho phép nhân viên/admin đang đăng nhập tự cập nhật thông tin tài khoản của mình.
     * Không cho đổi VaiTro hay TrangThai qua đây.
     */
    public function updateStaffProfile(Request $request)
    {
        $nhanVien = auth('nhanvien')->user();

        $data = $request->validate(
            [
                'HoTen'       => ['required', 'string', 'max:100'],
                'TenDangNhap' => ['required', 'string', 'max:50', 'unique:nhanvien,TenDangNhap,' . $nhanVien->MaNhanVien . ',MaNhanVien'],
                'MatKhau'     => ['nullable', 'string', 'min:6'],
            ],
            [
                'HoTen.required'       => 'Họ tên không được để trống.',
                'TenDangNhap.required' => 'Tên đăng nhập không được để trống.',
                'TenDangNhap.unique'   => 'Tên đăng nhập đã được sử dụng.',
                'MatKhau.min'          => 'Mật khẩu tối thiểu 6 ký tự.',
            ]
        );

        $nhanVien->HoTen       = $data['HoTen'];
        $nhanVien->TenDangNhap = $data['TenDangNhap'];
        if (!empty($data['MatKhau'])) {
            $nhanVien->MatKhau = Hash::make($data['MatKhau']);
        }
        $nhanVien->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật tài khoản thành công',
            'user'    => $nhanVien->fresh(),
        ]);
    }

    public function memberProfile()
    {
        return response()->json([
            'success' => true,
            'user' => auth('khachhang')->user()
        ]);
    }
    public function logout()
    {
        try {

            JWTAuth::invalidate(JWTAuth::getToken());

            return response()->json([
                'success' => true,
                'message' => 'Đăng xuất thành công'
            ]);
        } catch (\Exception) {

            return response()->json([
                'success' => false,
                'message' => 'Token không hợp lệ'
            ], 401);
        }
    }
    public function register(Request $request)
    {
        $request->validate(
            [
                'HoTen' => [
                    'required',
                    'min:3',
                    'max:100',
                    'regex:/^[\pL\s]+$/u'
                ],

                'Email' => [
                    'required',
                    'email',
                    'unique:khachhang,Email'
                ],

                'SoDienThoai' => [
                    'required',
                    'regex:/^(0)[0-9]{9}$/',
                    'unique:khachhang,SoDienThoai'
                ],

                'NgaySinh' => [
                    'required',
                    'date',
                    'before:today'
                ],

                'GioiTinh' => [
                    'required',
                    'in:Nam,Nu'
                ],

                'MatKhau' => [
                    'required',
                    'string',
                    'min:8',
                    'max:20',
                    'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).+$/'
                ],

                'MatKhau_confirmation' => [
                    'required',
                    'same:MatKhau'
                ],
            ],
            [
                'HoTen.required' => 'Họ tên không được để trống.',
                'HoTen.min' => 'Họ tên phải từ 3 ký tự.',
                'HoTen.max' => 'Họ tên không quá 100 ký tự.',
                'HoTen.regex' => 'Họ tên không hợp lệ.',

                'Email.required' => 'Email không được để trống.',
                'Email.email' => 'Email không đúng định dạng.',
                'Email.unique' => 'Email đã tồn tại.',

                'SoDienThoai.required' => 'Số điện thoại không được để trống.',
                'SoDienThoai.regex' => 'Số điện thoại không hợp lệ.',

                'NgaySinh.required' => 'Ngày sinh không được để trống.',
                'NgaySinh.before' => 'Ngày sinh không hợp lệ.',

                'GioiTinh.required' => 'Vui lòng chọn giới tính.',

                'MatKhau.required' => 'Mật khẩu không được để trống.',
                'MatKhau.min' => 'Mật khẩu phải từ 8 ký tự.',
                'MatKhau.max' => 'Mật khẩu tối đa 20 ký tự.',
                'MatKhau.regex' => 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.',

                'MatKhau_confirmation.required' => 'Vui lòng xác nhận mật khẩu.',
                'MatKhau_confirmation.same' => 'Xác nhận mật khẩu không khớp.',
            ]
        );

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

        $khachHang = DB::transaction(function () use ($request, $defaultRank) {
            return KhachHang::create([
                'MaKhachHang' => $this->codes->next(
                    'khachhang',
                    'MaKhachHang',
                    'KH'
                ),
                'HoTen' => trim($request->HoTen),
                'Email' => mb_strtolower(trim($request->Email)),
                'SoDienThoai' => trim($request->SoDienThoai),
                'NgaySinh' => $request->NgaySinh,
                'GioiTinh' => $request->GioiTinh,
                'MatKhau' => bcrypt($request->MatKhau),
                'TongDiem' => 0,
                'MaHangThanhVien' => $defaultRank,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công',
            'user' => $khachHang
        ]);
    }
    public function updateMemberProfile(Request $request)
    {
        $khachHang = auth('khachhang')->user();

        $request->validate(
            [
                'HoTen' => [
                    'required',
                    'min:3',
                    'max:100',
                    'regex:/^[\pL\s]+$/u'
                ],

                'Email' => [
                    'required',
                    'email',
                    'unique:khachhang,Email,' . $khachHang->MaKhachHang . ',MaKhachHang'
                ],

                'SoDienThoai' => [
                    'required',
                    'regex:/^(0)[0-9]{9}$/',
                    'unique:khachhang,SoDienThoai,' . $khachHang->MaKhachHang . ',MaKhachHang'
                ],

                'NgaySinh' => [
                    'required',
                    'date',
                    'before:today'
                ],

                'GioiTinh' => [
                    'required',
                    'in:Nam,Nu,Nữ'
                ]
            ]
        );

        $khachHang->update([
            'HoTen' => trim((string) $request->HoTen),
            'Email' => mb_strtolower(trim((string) $request->Email)),
            'SoDienThoai' => trim((string) $request->SoDienThoai),
            'NgaySinh' => $request->NgaySinh,
            'GioiTinh' => $request->GioiTinh === 'Nữ' ? 'Nu' : $request->GioiTinh
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin thành công',
            'user' => $khachHang->fresh()
        ]);
    }
    public function changePassword(Request $request)
    {
        $khachHang = auth('khachhang')->user();

        $request->validate(
            [
                'MatKhauHienTai' => [
                    'required'
                ],

                'MatKhauMoi' => [
                    'required',
                    'string',
                    'min:8',
                    'max:20',
                    'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).+$/'
                ],

                'MatKhauMoi_confirmation' => [
                    'required',
                    'same:MatKhauMoi'
                ],
            ],
            [
                'MatKhauHienTai.required' => 'Vui lòng nhập mật khẩu hiện tại.',

                'MatKhauMoi.required' => 'Mật khẩu mới không được để trống.',
                'MatKhauMoi.min' => 'Mật khẩu mới phải từ 8 ký tự.',
                'MatKhauMoi.max' => 'Mật khẩu mới tối đa 20 ký tự.',
                'MatKhauMoi.regex' => 'Mật khẩu mới phải có chữ hoa, chữ thường, số và ký tự đặc biệt.',

                'MatKhauMoi_confirmation.required' => 'Vui lòng xác nhận mật khẩu mới.',
                'MatKhauMoi_confirmation.same' => 'Xác nhận mật khẩu mới không khớp.',
            ]
        );

        $changeResult = DB::transaction(function () use ($khachHang, $request) {
            $lockedCustomer = KhachHang::where('MaKhachHang', $khachHang->MaKhachHang)
                ->lockForUpdate()
                ->first();

            if (!$lockedCustomer || !Hash::check($request->MatKhauHienTai, $lockedCustomer->MatKhau)) {
                return 'incorrect_current';
            }

            if (Hash::check($request->MatKhauMoi, $lockedCustomer->MatKhau)) {
                return 'same_password';
            }

            $lockedCustomer->MatKhau = Hash::make($request->MatKhauMoi);
            $lockedCustomer->save();

            return 'changed';
        });

        if ($changeResult === 'incorrect_current') {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu hiện tại không đúng.',
                'errors' => [
                    'MatKhauHienTai' => ['Mật khẩu hiện tại không đúng.']
                ]
            ], 422);
        }

        if ($changeResult === 'same_password') {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu mới không được trùng mật khẩu hiện tại.',
                'errors' => [
                    'MatKhauMoi' => ['Mật khẩu mới không được trùng mật khẩu hiện tại.']
                ]
            ], 422);
        }

        $freshCustomer = KhachHang::findOrFail($khachHang->MaKhachHang);
        $newToken = JWTAuth::fromUser($freshCustomer);

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.',
            'token' => $newToken,
        ]);
    }
    public function forgotPassword(Request $request)
    {
        $request->validate(
            [
                'Email' => 'required|email',
                'SoDienThoai' => ['required', 'regex:/^0[0-9]{9}$/'],
                'NgaySinh' => ['required', 'date', 'before:today'],
            ],
            [
                'Email.required' => 'Vui lòng nhập email.',
                'Email.email' => 'Email không hợp lệ.',
                'SoDienThoai.required' => 'Vui lòng nhập số điện thoại.',
                'NgaySinh.required' => 'Vui lòng nhập ngày sinh.'
            ]
        );

        $khachHang = KhachHang::where('Email', mb_strtolower(trim((string) $request->Email)))
            ->where('SoDienThoai', trim((string) $request->SoDienThoai))
            ->where('NgaySinh', $request->NgaySinh)
            ->first();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Thông tin xác thực không chính xác.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Xác thực thành công.',
            'reset_token' => $this->passwordResetTokens->create($khachHang),
            'expires_in' => PasswordResetTokenService::TTL_MINUTES * 60,
        ]);
    }
    public function resetPassword(Request $request)
    {
        $request->validate(
            [
                'Email' => 'required|email',
                'SoDienThoai' => ['required', 'regex:/^0[0-9]{9}$/'],
                'NgaySinh' => ['required', 'date', 'before:today'],
                'ResetToken' => ['required', 'string', 'max:2048'],

                'MatKhau' => [
                    'required',
                    'string',
                    'min:8',
                    'max:20',
                    'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).+$/'
                ],

                'MatKhau_confirmation' => [
                    'required',
                    'same:MatKhau'
                ]
            ]
        );

        $resetResult = DB::transaction(function () use ($request) {
            $khachHang = KhachHang::where(
                    'Email',
                    mb_strtolower(trim((string) $request->Email))
                )
                ->where('SoDienThoai', trim((string) $request->SoDienThoai))
                ->where('NgaySinh', $request->NgaySinh)
                ->lockForUpdate()
                ->first();

            if (!$khachHang) return 'customer_not_found';

            if (!$this->passwordResetTokens->isValid($request->ResetToken, $khachHang)) {
                return 'invalid_token';
            }

            if (Hash::check($request->MatKhau, $khachHang->MatKhau)) {
                return 'same_password';
            }

            $khachHang->MatKhau = Hash::make($request->MatKhau);
            $khachHang->save();

            return 'changed';
        });

        if ($resetResult === 'customer_not_found') {
            return response()->json([
                'success' => false,
                'message' => 'Thông tin xác thực không đúng.'
            ], 404);
        }

        if ($resetResult === 'invalid_token') {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
            ], 422);
        }

        if ($resetResult === 'same_password') {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu mới không được trùng mật khẩu hiện tại.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.'
        ]);
    }

}
