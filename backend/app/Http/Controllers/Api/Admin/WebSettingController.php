<?php
// app/Http/Controllers/Api/Admin/WebSettingController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WebSettingController extends Controller
{
    public function show()
    {
        $setting = WebSetting::first();

        if (!$setting) {
            // Endpoint public chỉ đọc, không tự tạo dữ liệu khi nhận GET.
            $setting = new WebSetting([
                'TenWebsite' => 'Buffet VIP',
                'Logo' => null,
                'DiaChi' => '',
                'EmailLienHe' => '',
                'SoDienThoai' => '',
                'NoiDungWebsite' => null,
            ]);
        }

        return response()->json(['success' => true, 'data' => $setting]);
    }

    /**
     * Cập nhật cấu hình website.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'TenWebsite'     => ['required', 'string', 'max:150'],
            'Logo'           => ['nullable', 'string', 'max:255'],
            'DiaChi'         => ['nullable', 'string', 'max:255'],
            'EmailLienHe'    => ['nullable', 'email', 'max:150'],
            'SoDienThoai'    => ['nullable', 'string', 'max:20'],
            'NoiDungWebsite' => ['nullable', 'string'],
        ]);

        $setting = DB::transaction(function () use ($data) {
            $setting = WebSetting::query()->lockForUpdate()->first() ?? new WebSetting();
            $setting->TenWebsite     = trim($data['TenWebsite']);
            $setting->Logo           = $data['Logo'] ?: null;
            $setting->DiaChi         = trim((string) ($data['DiaChi'] ?? ''));
            $setting->EmailLienHe    = strtolower(trim((string) ($data['EmailLienHe'] ?? '')));
            $setting->SoDienThoai    = trim((string) ($data['SoDienThoai'] ?? ''));
            $setting->NoiDungWebsite = $data['NoiDungWebsite'] ?: null;
            $setting->save();

            return $setting;
        });

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cấu hình website thành công',
            'data'    => $setting,
        ]);
    }
}
