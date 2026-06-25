<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\KhachHang;
use App\Models\NhanVien;
use Illuminate\Support\Facades\Hash;

class HashPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:hash-passwords';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Hash all plain text passwords in KhachHang and NhanVien tables';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Hash password khách hàng
        KhachHang::all()->each(function ($kh) {

            // Nếu mật khẩu đã hash thì bỏ qua
            if (!Hash::needsRehash($kh->MatKhau)) {
                return;
            }

            $kh->MatKhau = Hash::make($kh->MatKhau);
            $kh->save();
        });

        // Hash password nhân viên
        NhanVien::all()->each(function ($nv) {

            // Nếu mật khẩu đã hash thì bỏ qua
            if (!Hash::needsRehash($nv->MatKhau)) {
                return;
            }

            $nv->MatKhau = Hash::make($nv->MatKhau);
            $nv->save();
        });

        $this->info('Hash password thành công!');
    }
}