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
        $request->validate([
            'email' => 'required',
            'password' => 'required',
        ]);

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
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

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
        ],401);

    }
}
public function register(Request $request)
{
    $request->validate([
        'HoTen' => 'required',
        'NgaySinh' => 'required',
        'GioiTinh' => 'required',
        'Email' => 'required|email|unique:khachhang,Email',
        'SoDienThoai' => 'required',
        'MatKhau' => 'required|min:6'
    ]);

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
        'NgaySinh' => $request->NgaySinh,
        'GioiTinh' => $request->GioiTinh,
        'NgayDangKy' => now()->format('Y-m-d'),
        'Email' => $request->Email,
        'SoDienThoai' => $request->SoDienThoai,
        'MatKhau' => bcrypt($request->MatKhau),
        'MaHangThanhVien' => 'HTV001'

    ]);

    return response()->json([
        'success' => true,
        'message' => 'Đăng ký thành công',
        'user' => $khachHang
    ]);
}
}