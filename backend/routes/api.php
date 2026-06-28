<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MemberPointController;

Route::post('/member/login', [AuthController::class, 'memberLogin']);
Route::post('/staff/login', [AuthController::class, 'staffLogin']);

Route::middleware('auth:nhanvien')->group(function () {

    Route::get('/staff/profile', [AuthController::class, 'staffProfile']);
});

Route::middleware('auth:khachhang')->group(function () {

    Route::get('/member/profile', [AuthController::class, 'memberProfile']);
    Route::get(
        '/member/points',
        [MemberPointController::class, 'index']

    );
});
Route::post('/logout', [AuthController::class, 'logout']);
