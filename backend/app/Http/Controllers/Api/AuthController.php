<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KhachHang;
use App\Models\NhanVien;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Str;

class AuthController extends Controller
{
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

        $khachHang = KhachHang::where('Email', $request->email)->first();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Email không tồn tại'
            ], 401);
        }

        if (!Hash::check($request->password, $khachHang->MatKhau)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu không đúng'
            ], 401);
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

        $nhanVien = NhanVien::where('TenDangNhap', $request->username)->first();

        if (!$nhanVien) {
            return response()->json([
                'success' => false,
                'message' => 'Tên đăng nhập không tồn tại'
            ], 401);
        }

        if (!Hash::check($request->password, $nhanVien->MatKhau)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu không đúng'
            ], 401);
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
        } catch (\Exception $e) {

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
                    'regex:/^(0)[0-9]{9}$/'
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

        $lastKH = KhachHang::orderBy('MaKhachHang', 'desc')->first();

        if ($lastKH) {
            $so = (int) substr($lastKH->MaKhachHang, 2) + 1;
        } else {
            $so = 1;
        }

        $maKH = 'KH' . str_pad($so, 3, '0', STR_PAD_LEFT);

        $khachHang = KhachHang::create([
            'MaKhachHang' => $maKH,
            'HoTen' => $request->HoTen,
            'Email' => $request->Email,
            'SoDienThoai' => $request->SoDienThoai,
            'NgaySinh' => $request->NgaySinh,
            'GioiTinh' => $request->GioiTinh,
            'MatKhau' => bcrypt($request->MatKhau),
            'TongDiem' => 0,
            'MaHangThanhVien' => 'HTV001'
        ]);

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
                    'in:Nam,Nữ'
                ]
            ]
        );

        $khachHang->update([
            'HoTen' => $request->HoTen,
            'Email' => $request->Email,
            'SoDienThoai' => $request->SoDienThoai,
            'NgaySinh' => $request->NgaySinh,
            'GioiTinh' => $request->GioiTinh
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin thành công',
            'user' => $khachHang->fresh()
        ]);
    }
}
