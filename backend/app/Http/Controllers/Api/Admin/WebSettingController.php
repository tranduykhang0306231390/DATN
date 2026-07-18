<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WebSettingController extends Controller
{
    /**
     * Lấy cấu hình website.
     *
     * Endpoint này có thể được sử dụng công khai để hiển thị:
     * - Tên website
     * - Logo
     * - Địa chỉ
     * - Email
     * - Số điện thoại
     * - Nội dung giới thiệu
     *
     * Không tự tạo bản ghi database khi nhận request GET.
     */
    public function show()
    {
        $setting = WebSetting::query()->first();

        if (!$setting) {
            $setting = new WebSetting([
                'TenWebsite' => 'Buffet VIP',
                'Logo' => null,
                'DiaChi' => '',
                'EmailLienHe' => '',
                'SoDienThoai' => '',
                'NoiDungWebsite' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $setting,
        ]);
    }

    /**
     * Cập nhật cấu hình website.
     *
     * Route cập nhật phải nằm trong middleware Admin.
     */
    public function update(Request $request)
    {
        $this->normalizeRequest($request);

        $data = $request->validate(
            [
                'TenWebsite' => [
                    'required',
                    'string',
                    'max:150',
                ],

                'Logo' => [
                    'nullable',
                    'image',
                    'max:4096',
                ],

                'DiaChi' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'EmailLienHe' => [
                    'nullable',
                    'email',
                    'max:150',
                ],

                'SoDienThoai' => [
                    'nullable',
                    'string',
                    'max:20',
                ],

                'NoiDungWebsite' => [
                    'nullable',
                    'string',
                ],
            ],
            [
                'TenWebsite.required' =>
                    'Vui lòng nhập tên website.',

                'TenWebsite.max' =>
                    'Tên website không được vượt quá 150 ký tự.',

                'Logo.image' =>
                    'File tải lên phải là ảnh.',

                'Logo.max' =>
                    'Ảnh logo không được vượt quá 4MB.',

                'DiaChi.max' =>
                    'Địa chỉ không được vượt quá 255 ký tự.',

                'EmailLienHe.email' =>
                    'Email liên hệ không đúng định dạng.',

                'EmailLienHe.max' =>
                    'Email liên hệ không được vượt quá 150 ký tự.',

                'SoDienThoai.max' =>
                    'Số điện thoại không được vượt quá 20 ký tự.',
            ]
        );

        $setting = DB::transaction(function () use ($data, $request) {
            /*
             * Khóa bản ghi cấu hình hiện tại để tránh hai Admin
             * cập nhật đồng thời và ghi đè dữ liệu của nhau.
             */
            $setting = WebSetting::query()
                ->lockForUpdate()
                ->first();

            if (!$setting) {
                $setting = new WebSetting();
            }

            $setting->TenWebsite = trim(
                $data['TenWebsite']
            );

            $setting->Logo =
                $this->handleLogoUpload($request, $setting->Logo);

            /*
             * DiaChi, EmailLienHe, SoDienThoai là NOT NULL trong database,
             * nên khi admin để trống phải lưu chuỗi rỗng thay vì null.
             */
            $setting->DiaChi =
                $data['DiaChi'] ?? '';

            $setting->EmailLienHe =
                isset($data['EmailLienHe'])
                    ? strtolower($data['EmailLienHe'])
                    : '';

            $setting->SoDienThoai =
                $data['SoDienThoai'] ?? '';

            $setting->NoiDungWebsite =
                $data['NoiDungWebsite'] ?? null;

            $setting->save();

            return $setting;
        });

        return response()->json([
            'success' => true,
            'message' =>
                'Cập nhật cấu hình website thành công.',
            'data' => $setting,
        ]);
    }

    /**
     * Chuẩn hóa dữ liệu chuỗi trước khi validation.
     *
     * Chuỗi rỗng được chuyển thành null đối với các trường không bắt buộc.
     */
    private function normalizeRequest(Request $request): void
    {
        $normalized = [];

        if ($request->has('TenWebsite')) {
            $normalized['TenWebsite'] = trim(
                (string) $request->input('TenWebsite')
            );
        }

        foreach (
            [
                'DiaChi',
                'EmailLienHe',
                'SoDienThoai',
                'NoiDungWebsite',
            ] as $field
        ) {
            if (!$request->has($field)) {
                continue;
            }

            $value = trim(
                (string) $request->input($field)
            );

            $normalized[$field] =
                $value !== '' ? $value : null;
        }

        if ($normalized !== []) {
            $request->merge($normalized);
        }
    }

    /**
     * Lưu file logo được tải lên vào public/logo, trả về tên file.
     * Nếu không có file mới (giữ logo hiện tại), trả lại giá trị hiện có.
     */
    private function handleLogoUpload(Request $request, ?string $current = null): ?string
    {
        if (!$request->hasFile('Logo')) {
            return $current;
        }

        $file = $request->file('Logo');

        $filename = 'logo_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

        $file->move(public_path('logo'), $filename);

        return $filename;
    }
}