<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chỉ cho phép nhân viên đang hoạt động truy cập và có thể giới hạn vai trò.
 */
class StaffMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        try {
            $guard = auth('nhanvien');
            $user = $guard->user();
            $tokenFingerprint = $guard->payload()->get('password_fingerprint');
        } catch (\Throwable) {
            $user = null;
            $tokenFingerprint = null;
        }

        if (
            !$user
            || !is_string($tokenFingerprint)
            || !hash_equals($user->getJwtPasswordFingerprint(), $tokenFingerprint)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
            ], 401);
        }

        if ($user->TrangThai !== 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản nhân viên đã bị vô hiệu hóa.',
            ], 403);
        }

        if (!empty($roles) && !in_array($user->VaiTro, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập chức năng này.',
                'your_role' => $user->VaiTro,
                'required_roles' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
