<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chỉ cho phép nhân viên (guard: nhanvien) truy cập.
 * Truyền thêm roles nếu muốn giới hạn theo vai trò cụ thể.
 *
 * Ví dụ dùng trong route:
 *   ->middleware('staff')            // mọi nhân viên
 *   ->middleware('staff:Admin')      // chỉ Admin
 *   ->middleware('staff:Admin,NhanVien') // Admin hoặc NhanVien
 */
class StaffMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Thử xác thực bằng guard nhanvien
        $user = auth('nhanvien')->user();

        // Không có token hoặc token không thuộc guard nhanvien
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập với tư cách nhân viên.'
            ], 401);
        }

        // Kiểm tra trạng thái tài khoản
        if ($user->TrangThai !== 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản nhân viên đã bị vô hiệu hóa.'
            ], 403);
        }

        // Nếu có yêu cầu role cụ thể thì kiểm tra thêm
        if (!empty($roles) && !in_array($user->VaiTro, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập chức năng này.',
                'your_role' => $user->VaiTro,
                'required_roles' => $roles
            ], 403);
        }

        return $next($request);
    }
}