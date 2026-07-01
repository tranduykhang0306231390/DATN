<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MemberPointController;
use App\Http\Controllers\Api\MemberHistoryController;
use App\Http\Controllers\Api\HoaDonController;

/*
|--------------------------------------------------------------------------
| Public API
|--------------------------------------------------------------------------
*/

Route::post('/member/login', [AuthController::class, 'memberLogin']);
Route::post('/member/register', [AuthController::class, 'register']);
Route::post('/staff/login', [AuthController::class, 'staffLogin']);
Route::post('/logout', [AuthController::class, 'logout']);

/*
|--------------------------------------------------------------------------
| MEMBER
|--------------------------------------------------------------------------
*/

Route::middleware('member')->prefix('member')->group(function () {

    Route::get('/profile', [AuthController::class, 'memberProfile']);
    Route::get('/points', [MemberPointController::class, 'index']);
    Route::get('/history', [MemberHistoryController::class, 'index']);

    Route::post('/logout', [AuthController::class, 'logout']);
});

/*
|--------------------------------------------------------------------------
| STAFF
|--------------------------------------------------------------------------
*/

Route::middleware('staff:Admin,NhanVien')->prefix('staff')->group(function () {

    Route::get('/profile', [AuthController::class, 'staffProfile']);

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/loai-ve', [HoaDonController::class, 'getLoaiVe']);

    Route::post('/khach-hang/lookup', [HoaDonController::class, 'lookupKhachHang']);

    Route::post('/hoa-don', [HoaDonController::class, 'taoHoaDon']);

    Route::get('/hoa-don/{maHoaDon}', [HoaDonController::class, 'chiTietHoaDon']);

    // Các API nhân viên khác...
});

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

Route::middleware('staff:Admin')->prefix('admin')->group(function () {

    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Chỉ Admin mới truy cập được.'
        ]);
    });

    // API admin...
});