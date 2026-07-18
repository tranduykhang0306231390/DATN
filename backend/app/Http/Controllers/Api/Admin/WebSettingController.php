<?php
// app/Http/Controllers/Api/Admin/WebSettingController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebSetting;
use Illuminate\Http\Request;

class WebSettingController extends Controller
{
    public function show()
    {
        $setting = WebSetting::first();

        if (!$setting) {
            $setting = new WebSetting();
            $setting->MaWebSetting   = 'WS001';
            $setting->TenWebsite     = 'Buffet VIP';
            $setting->Logo           = null;
            $setting->DiaChi         = null;
            $setting->EmailLienHe    = null;
            $setting->SoDienThoai    = null;
            $setting->NoiDungWebsite = null;
            $setting->save();
        }

        return response()->json(['success' => true, 'data' => $setting]);
    }

    /**
     * Cập nhật cấu hình website.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'TenWebsite'     => ['required', 'string', 'max:255'],
            'Logo'           => ['nullable', 'string', 'max:255'],
            'DiaChi'         => ['nullable', 'string', 'max:255'],
            'EmailLienHe'    => ['nullable', 'email', 'max:255'],
            'SoDienThoai'    => ['nullable', 'string', 'max:20'],
            'NoiDungWebsite' => ['nullable', 'string'],
        ]);

        $setting = WebSetting::first();

        if (!$setting) {
            $setting = new WebSetting();
            $setting->MaWebSetting = 'WS001';
        }

        $setting->TenWebsite     = $data['TenWebsite'];
        $setting->Logo           = $data['Logo'] ?: null;
        $setting->DiaChi         = $data['DiaChi'] ?: null;
        $setting->EmailLienHe    = $data['EmailLienHe'] ?: null;
        $setting->SoDienThoai    = $data['SoDienThoai'] ?: null;
        $setting->NoiDungWebsite = $data['NoiDungWebsite'] ?: null;
        $setting->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cấu hình website thành công',
            'data'    => $setting,
        ]);
    }
}