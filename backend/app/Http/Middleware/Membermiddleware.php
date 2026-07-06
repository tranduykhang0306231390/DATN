<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chỉ cho phép khách hàng (guard: khachhang) truy cập.
 * Nếu token thuộc nhanvien hoặc không có token → từ chối.
 */
class MemberMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Thử xác thực bằng guard khachhang
        $user = auth('khachhang')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập với tư cách khách hàng.'
            ], 401);
        }

        if ($user->TrangThai !== 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa.'
            ], 403);
        }

        return $next($request);
    }
}