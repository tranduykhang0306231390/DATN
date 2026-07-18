<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chỉ cho phép khách hàng đang hoạt động truy cập.
 */
class MemberMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $guard = auth('khachhang');
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
                'message' => 'Tài khoản của bạn đã bị khóa.',
            ], 403);
        }

        return $next($request);
    }
}
