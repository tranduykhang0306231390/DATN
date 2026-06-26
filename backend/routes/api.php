<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HoaDonController;

Route::post('/member/login', [AuthController::class, 'memberLogin']);
Route::post('/staff/login', [AuthController::class, 'staffLogin']);
Route::post('/member/register', [AuthController::class, 'register']);


Route::middleware('auth:nhanvien')->group(function () {

    Route::post('/staff/logout', [AuthController::class, 'logout']);

    Route::get('/staff/profile',   [AuthController::class, 'staffProfile']);

    Route::get('/loai-ve',[HoaDonController::class, 'getLoaiVe']);

    Route::post('/khach-hang/lookup',[HoaDonController::class, 'lookupKhachHang']);

    Route::post('/hoa-don', [HoaDonController::class, 'taoHoaDon']);

    Route::get('/hoa-don/{maHoaDon}', [HoaDonController::class, 'chiTietHoaDon']);

});



Route::middleware('auth:khachhang')->group(function () {

    Route::get('/member/profile', [AuthController::class, 'memberProfile']);

    Route::post('/member/logout',  [AuthController::class, 'logout']);
    

});
Route::post('/logout', [AuthController::class, 'logout']);

