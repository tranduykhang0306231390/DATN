<?php

namespace App\Console\Commands;

use App\Models\KhachHang;
use App\Services\PhoneNumberService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Chuyển dữ liệu khách hàng cũ sang mô hình đăng nhập bằng số điện thoại.
 *
 * Quy tắc bắt buộc (không được vi phạm):
 * - Tài khoản CHƯA có mật khẩu hợp lệ (rỗng hoặc chưa từng hash) mới được
 *   khởi tạo mật khẩu mặc định = số điện thoại (đã chuẩn hóa) và hash lại.
 * - Tài khoản ĐÃ có password hash hợp lệ thì GIỮ NGUYÊN, không bao giờ ghi
 *   đè — dù đó là hash của số điện thoại cũ hay của một mật khẩu khách
 *   hàng đã tự đổi.
 * - Không tự đánh dấu phone_verified_at nếu chưa có bằng chứng xác minh.
 * - Không tự gộp hoặc xóa khách hàng có số điện thoại trùng lặp — chỉ báo
 *   cáo để xử lý thủ công.
 *
 * Chạy: php artisan customers:migrate-phone-login [--dry-run]
 */
class MigrateCustomersToPhoneLogin extends Command
{
    protected $signature = 'customers:migrate-phone-login {--dry-run : Chỉ báo cáo, không ghi vào database}';

    protected $description = 'Chuẩn hóa số điện thoại và khởi tạo mật khẩu mặc định (nếu thiếu) cho khách hàng cũ';

    public function handle(PhoneNumberService $phoneNumbers): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $customers = KhachHang::all();

        // Bước 1: chuẩn hóa số điện thoại (chỉ trong bộ nhớ) để phát hiện trùng lặp.
        $byNormalizedPhone = [];
        $invalidPhoneCustomers = [];

        foreach ($customers as $customer) {
            $normalized = $phoneNumbers->normalize($customer->SoDienThoai);

            if ($normalized === null) {
                $invalidPhoneCustomers[] = $customer;
                continue;
            }

            $byNormalizedPhone[$normalized][] = $customer;
        }

        if (!empty($invalidPhoneCustomers)) {
            $this->warn('Các khách hàng có số điện thoại không hợp lệ / không chuẩn hóa được (bỏ qua, cần xử lý thủ công):');
            foreach ($invalidPhoneCustomers as $customer) {
                $this->line("  - {$customer->MaKhachHang}: \"{$customer->SoDienThoai}\"");
            }
        }

        $duplicateGroups = array_filter($byNormalizedPhone, fn (array $group) => count($group) > 1);

        if (!empty($duplicateGroups)) {
            $this->error('Phát hiện số điện thoại trùng lặp — KHÔNG tự động gộp/xóa. Cần xử lý thủ công:');
            foreach ($duplicateGroups as $phone => $group) {
                $maKhachHangs = implode(', ', array_map(fn ($c) => $c->MaKhachHang, $group));
                $this->line("  - {$phone}: {$maKhachHangs}");
            }
        }

        $passwordBackfilled = 0;
        $phoneNormalizedCount = 0;
        $skippedDuplicates = 0;

        foreach ($byNormalizedPhone as $normalizedPhone => $group) {
            if (count($group) > 1) {
                $skippedDuplicates += count($group);
                continue;
            }

            $customer = $group[0];

            DB::transaction(function () use ($customer, $normalizedPhone, $dryRun, &$passwordBackfilled, &$phoneNormalizedCount) {
                $locked = KhachHang::where('MaKhachHang', $customer->MaKhachHang)->lockForUpdate()->first();
                $changed = false;

                if ($locked->SoDienThoai !== $normalizedPhone) {
                    $changed = true;
                    $phoneNormalizedCount++;
                    if (!$dryRun) {
                        $locked->SoDienThoai = $normalizedPhone;
                    }
                }

                $currentPassword = (string) $locked->MatKhau;
                if ($currentPassword === '') {
                    // Chưa từng có mật khẩu nào -> khởi tạo mặc định = số điện thoại.
                    $changed = true;
                    $passwordBackfilled++;
                    if (!$dryRun) {
                        $locked->MatKhau = Hash::make($normalizedPhone);
                    }
                } elseif (Hash::needsRehash($currentPassword)) {
                    // Có giá trị nhưng chưa từng được hash (dữ liệu cũ dạng
                    // plaintext) -> hash lại ĐÚNG giá trị hiện có, không ép
                    // về số điện thoại (giữ đúng mật khẩu đang có, chỉ hash nó).
                    $changed = true;
                    $passwordBackfilled++;
                    if (!$dryRun) {
                        $locked->MatKhau = Hash::make($currentPassword);
                    }
                }
                // Nếu đã là hash hợp lệ (bcrypt) rồi -> giữ nguyên tuyệt đối,
                // không đụng vào, dù đó là hash của SĐT cũ hay mật khẩu đã đổi.

                // KHÔNG tự đặt phone_verified_at ở đây — chỉ được xác minh
                // thật khi khách hàng tự đăng nhập OTP thành công lần đầu.

                if ($changed && !$dryRun) {
                    $locked->save();
                }
            });
        }

        $this->newLine();
        $this->info(($dryRun ? '[DRY-RUN] ' : '') . 'Hoàn tất.');
        $this->line("  - Số khách hàng đã xử lý: " . $customers->count());
        $this->line("  - Số điện thoại được chuẩn hóa lại: {$phoneNormalizedCount}");
        $this->line("  - Mật khẩu mặc định được khởi tạo/hash lại: {$passwordBackfilled}");
        $this->line("  - Bỏ qua vì trùng số điện thoại (cần xử lý thủ công): {$skippedDuplicates}");
        $this->line("  - Số điện thoại không hợp lệ (cần xử lý thủ công): " . count($invalidPhoneCustomers));

        if ($dryRun) {
            $this->warn('Đây là dry-run — không có gì được ghi vào database. Chạy lại không kèm --dry-run để áp dụng.');
        }

        return self::SUCCESS;
    }
}
