<?php

namespace App\Console\Commands;

use App\Models\CauHinhDatBan;
use App\Models\DatBan;
use App\Services\ThongBaoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Dọn các lượt đặt bàn quá hạn:
 * - ChoThanhToanCoc quá hạn giữ chỗ (chưa thanh toán cọc) -> DaHuy.
 * - DaXacNhan quá giờ hẹn mà khách chưa đến -> KhongDen, mất cọc.
 *
 * Cần php artisan schedule:work (dev) hoặc cron thật gọi
 * `php artisan schedule:run` mỗi phút (production) để chạy tự động.
 */
class XuLyDatBanQuaHan extends Command
{
    protected $signature = 'datban:xu-ly-qua-han';

    protected $description = 'Tự động hủy đặt bàn hết hạn giữ chỗ và đánh dấu không đến khi quá giờ hẹn';

    public function handle(ThongBaoService $thongBao): int
    {
        $cauHinh = CauHinhDatBan::query()->first();

        $thoiGianGiuChoPhut = (int) ($cauHinh->ThoiGianGiuChoPhut ?? 10);
        $phutGiuBanSauGioHen = (int) ($cauHinh->PhutGiuBanSauGioHen ?? 15);

        $soHetHanCoc = $this->huyHetHanChoThanhToanCoc($thoiGianGiuChoPhut, $thongBao);
        $soKhongDen = $this->danhDauKhongDen($phutGiuBanSauGioHen, $thongBao);

        $this->info("Đã hủy {$soHetHanCoc} lượt hết hạn giữ chỗ, đánh dấu {$soKhongDen} lượt không đến.");

        return self::SUCCESS;
    }

    private function huyHetHanChoThanhToanCoc(int $thoiGianGiuChoPhut, ThongBaoService $thongBao): int
    {
        $quaHan = DatBan::query()
            ->where('TrangThai', 'ChoThanhToanCoc')
            ->where('ThoiGianTao', '<=', now()->subMinutes($thoiGianGiuChoPhut))
            ->pluck('MaDatBan');

        $soLuong = 0;

        foreach ($quaHan as $maDatBan) {
            DB::beginTransaction();

            try {
                $datBan = DatBan::query()
                    ->where('MaDatBan', $maDatBan)
                    ->lockForUpdate()
                    ->first();

                if (!$datBan || $datBan->TrangThai !== 'ChoThanhToanCoc') {
                    DB::rollBack();
                    continue;
                }

                $datBan->TrangThai = 'DaHuy';
                $datBan->ThoiGianHuy = now();
                $datBan->LyDoTuChoiHuy = 'Hết hạn thanh toán cọc.';
                $datBan->save();

                $thongBao->gui(
                    $datBan->MaKhachHang,
                    'Đặt bàn đã hết hạn giữ chỗ',
                    "Lượt đặt bàn {$maDatBan} đã tự động hủy do quá thời gian thanh toán cọc."
                );

                DB::commit();
                $soLuong++;
            } catch (\Throwable $exception) {
                DB::rollBack();

                Log::error('Không thể hủy đặt bàn hết hạn cọc', [
                    'ma_dat_ban' => $maDatBan,
                    'exception' => $exception,
                ]);
            }
        }

        return $soLuong;
    }

    private function danhDauKhongDen(int $phutGiuBanSauGioHen, ThongBaoService $thongBao): int
    {
        $quaHan = DatBan::query()
            ->where('TrangThai', 'DaXacNhan')
            ->where('ThoiGianDat', '<=', now()->subMinutes($phutGiuBanSauGioHen))
            ->pluck('MaDatBan');

        $soLuong = 0;

        foreach ($quaHan as $maDatBan) {
            DB::beginTransaction();

            try {
                $datBan = DatBan::query()
                    ->where('MaDatBan', $maDatBan)
                    ->lockForUpdate()
                    ->first();

                if (!$datBan || $datBan->TrangThai !== 'DaXacNhan') {
                    DB::rollBack();
                    continue;
                }

                $datBan->TrangThai = 'KhongDen';

                if ($datBan->TrangThaiCoc === 'DaThanhToan') {
                    $datBan->TrangThaiCoc = 'DaMat';
                }

                $datBan->save();

                $thongBao->gui(
                    $datBan->MaKhachHang,
                    'Đặt bàn được đánh dấu không đến',
                    "Lượt đặt bàn {$maDatBan} đã quá giờ hẹn mà chưa check-in nên được đánh dấu không đến."
                );

                DB::commit();
                $soLuong++;
            } catch (\Throwable $exception) {
                DB::rollBack();

                Log::error('Không thể đánh dấu không đến', [
                    'ma_dat_ban' => $maDatBan,
                    'exception' => $exception,
                ]);
            }
        }

        return $soLuong;
    }
}
