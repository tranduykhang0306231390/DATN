<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WebSetting;

class WebSettingSeeder extends Seeder
{
    public function run(): void
    {
        WebSetting::create([

            "TenWebsite"=>"BUFFET VIP",

            "Logo"=>"logo.png",

            "DiaChi"=>"138 Hồng Bàng, Phường Phú Lâm, TP. Hồ Chí Minh",

            "EmailLienHe"=>"buffetvip@gmail.com",

            "SoDienThoai"=>"0356522519",

            "NoiDungWebsite"=>"Buffet VIP mang đến trải nghiệm ẩm thực chất lượng cùng chương trình khách hàng thân thiết với nhiều ưu đãi hấp dẫn.

"

        ]);
    }
}