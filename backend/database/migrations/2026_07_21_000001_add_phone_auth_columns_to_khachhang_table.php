<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Bổ sung các cột phục vụ đăng nhập khách hàng bằng số điện thoại +
 * Firebase Phone Authentication. Không đổi kiểu/độ dài cột SoDienThoai
 * hay Email hiện có để tránh mất dữ liệu cũ.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('khachhang', function (Blueprint $table) {
            if (!Schema::hasColumn('khachhang', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('SoDienThoai');
            }

            if (!Schema::hasColumn('khachhang', 'firebase_uid')) {
                $table->string('firebase_uid', 128)->nullable()->after('phone_verified_at');
            }

            // Collation phải khớp CHÍNH XÁC với nhanvien.MaNhanVien
            // (utf8mb4_unicode_ci) — bảng khachhang mặc định dùng
            // utf8mb4_general_ci, nếu không set rõ collation thì MySQL sẽ
            // từ chối tạo khóa ngoại bên dưới (errno 150). Dùng ->change()
            // nếu cột đã tồn tại (kể cả từ một lần chạy dở trước đó) để đảm
            // bảo collation luôn đúng, thay vì bỏ qua và giữ collation sai.
            if (!Schema::hasColumn('khachhang', 'created_by_employee_id')) {
                $table->string('created_by_employee_id', 20)
                    ->nullable()
                    ->collation('utf8mb4_unicode_ci')
                    ->after('firebase_uid');
            } else {
                $table->string('created_by_employee_id', 20)
                    ->nullable()
                    ->collation('utf8mb4_unicode_ci')
                    ->change();
            }
        });

        $foreignKeyExists = DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())
            ->where('TABLE_NAME', 'khachhang')
            ->where('CONSTRAINT_NAME', 'khachhang_created_by_employee_id_foreign')
            ->exists();

        if (!$foreignKeyExists) {
            Schema::table('khachhang', function (Blueprint $table) {
                $table->foreign('created_by_employee_id')
                    ->references('MaNhanVien')
                    ->on('nhanvien')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('khachhang', function (Blueprint $table) {
            $table->dropForeign(['created_by_employee_id']);
            $table->dropColumn(['phone_verified_at', 'firebase_uid', 'created_by_employee_id']);
        });
    }
};
