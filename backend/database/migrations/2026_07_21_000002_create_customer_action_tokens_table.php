<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Token nội bộ dùng một lần cho "quên mật khẩu" và "đổi mật khẩu" của
 * khách hàng, cấp SAU KHI Firebase đã xác minh quyền sở hữu số điện
 * thoại. Chỉ lưu hash của token (token_hash), không lưu token gốc.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_action_tokens', function (Blueprint $table) {
            $table->id();

            $table->string('ma_khach_hang', 20);
            $table->foreign('ma_khach_hang')
                ->references('MaKhachHang')
                ->on('khachhang')
                ->cascadeOnDelete();

            // 'forgot_password' hoặc 'change_password'.
            $table->string('purpose', 40);

            $table->string('token_hash', 64);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();

            $table->timestamps();

            $table->index(['ma_khach_hang', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_action_tokens');
    }
};
