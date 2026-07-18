<?php
// app/Services/DiemTichLuyService.php
// Tách toàn bộ logic điểm ra đây để tái sử dụng ở nhiều nơi

namespace App\Services;

use App\Models\KhachHang;
use App\Models\HangThanhVien;
use App\Models\LichSuGiaoDichDiem;
use App\Models\LichSuHangThanhVien;
use App\Models\Thongbao;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DiemTichLuyService
{
    /**
     *   1. Điểm cơ bản = floor(TongThanhToan / SoTienQuyDoi) * SoDiemNhan
     *   2. Nếu TongThanhToan >= GiaTriHoaDonToiThieu  -> nhân HeSoNhanDiem
     *   3. Nếu đúng sinh nhật khách & NhanDoiSinhNhat -> nhân 2
     *
     * Trả về mảng chi tiết từng bước (không chỉ điểm cuối) để nơi gọi có
     * thể hiển thị cách tính minh bạch cho khách xem lúc thanh toán.
     */
    public function tinhDiem($quyTac, float $tongThanhToan, ?string $ngaySinh = null): array
    {
        $soTienQuyDoi = (float) $quyTac->SoTienQuyDoi;
        $mucToiThieu  = (float) ($quyTac->GiaTriHoaDonToiThieu ?? 0);
        $heSo         = (float) ($quyTac->HeSoNhanDiem ?? 1);
        $laSinhNhat   = ((int) ($quyTac->NhanDoiSinhNhat ?? 0) === 1 && $this->laSinhNhatHomNay($ngaySinh));

        // Hóa đơn có đạt giá trị tối thiểu để nhận hệ số không
        $apDungHeSo = ($mucToiThieu > 0 && $tongThanhToan >= $mucToiThieu && $heSo > 1);

        // 1. Điểm cơ bản
        $diemCoBan = $soTienQuyDoi > 0
            ? (int) floor($tongThanhToan / $soTienQuyDoi) * (int) $quyTac->SoDiemNhan
            : 0;

        $diem = $diemCoBan;

        // 2 & 3. Áp hệ số + nhân đôi sinh nhật — chỉ khi có điểm cơ bản
        if ($diemCoBan > 0) {
            if ($laSinhNhat) {
                // Sinh nhật: đủ điều kiện -> (Điểm * HeSo * 2); không đủ -> (Điểm * 2)
                $diem = $apDungHeSo ? (int) floor($diem * $heSo * 2) : $diem * 2;
            } elseif ($apDungHeSo) {
                $diem = (int) floor($diem * $heSo);
            }
        }

        return [
            'diem'            => $diem,
            'diemCoBan'       => $diemCoBan,
            'soTienQuyDoi'    => $soTienQuyDoi,
            'soDiemNhan'      => (int) $quyTac->SoDiemNhan,
            'mucToiThieu'     => $mucToiThieu,
            'heSo'            => $heSo,
            'apDungHeSo'      => $apDungHeSo,
            'laSinhNhat'      => $laSinhNhat,
        ];
    }

    /**
     * Hôm nay có phải sinh nhật khách không (so ngày + tháng, bỏ qua năm).
     */
    public function laSinhNhatHomNay(?string $ngaySinh): bool
    {
        if (empty($ngaySinh)) {
            return false;
        }

        try {
            $ns    = Carbon::parse($ngaySinh);
            $today = Carbon::today();
            return $ns->day === $today->day && $ns->month === $today->month;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Cộng điểm cho khách hàng sau khi tạo hóa đơn
     * Tự động kiểm tra và xử lý lên hạng
     */
    public function congDiem(KhachHang $khachHang, int $soDiem, string $maThamChieu): void
    {
        $diemTruoc = $khachHang->TongDiem;
        $diemSau   = $diemTruoc + $soDiem;

        $khachHang->increment('TongDiem', $soDiem);

        // Ghi lịch sử giao dịch điểm
        $this->ghiLichSuGiaoDich(
            loai:         'CongDiemHoaDon',
            soDiem:       $soDiem,
            truoc:        $diemTruoc,
            sau:          $diemSau,
            maKH:         $khachHang->MaKhachHang,
            maThamChieu:  $maThamChieu
        );

        // Thông báo tích điểm
        $this->taoThongBao(
            maKH:    $khachHang->MaKhachHang,
            tieuDe:  'Tích điểm thành công',
            noiDung: "Bạn đã được cộng {$soDiem} điểm từ hóa đơn {$maThamChieu}."
        );

        // Kiểm tra lên hạng
        $this->kiemTraLenHang($khachHang);
    }

    /**
     * Hoàn điểm khi hủy hóa đơn
     */
    public function hoanDiem(KhachHang $khachHang, int $soDiem, string $maThamChieu): void
    {
        $diemTruoc = $khachHang->TongDiem;
        $diemSau   = max(0, $diemTruoc - $soDiem);

        $khachHang->update(['TongDiem' => $diemSau]);

        $this->ghiLichSuGiaoDich(
            loai:        'HoanDiemHuyHD',
            soDiem:      $soDiem,
            truoc:       $diemTruoc,
            sau:         $diemSau,
            maKH:        $khachHang->MaKhachHang,
            maThamChieu: $maThamChieu
        );

        $this->taoThongBao(
            maKH:    $khachHang->MaKhachHang,
            tieuDe:  'Hóa đơn bị hủy',
            noiDung: "Hóa đơn {$maThamChieu} đã bị hủy. {$soDiem} điểm đã được hoàn lại."
        );
    }

    /**
     * Kiểm tra và cập nhật hạng thành viên
     */
    private function kiemTraLenHang(KhachHang $khachHang): void
    {
        $khachHang->refresh();

        $hangHienTai = HangThanhVien::find($khachHang->MaHangThanhVien);

        $hangMoi = HangThanhVien::where('DiemToiThieu', '<=', $khachHang->TongDiem)
            ->where('ThuTuHang', '>', $hangHienTai->ThuTuHang ?? 0)
            ->orderBy('ThuTuHang', 'desc')
            ->first();

        if (!$hangMoi) return;

        $maHangCu = $khachHang->MaHangThanhVien;
        $khachHang->update(['MaHangThanhVien' => $hangMoi->MaHangThanhVien]);

        // Tổng chi tiêu thực của khách tại thời điểm lên hạng
        $tongChiTieu = (float) DB::table('hoadon')
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'DaThanhToan')
            ->sum('TongTien');

        // Lịch sử thay đổi hạng
        $lastLSH = LichSuHangThanhVien::orderBy('MaLichSuHang', 'desc')->first();
        $soLSH   = $lastLSH ? ((int) substr($lastLSH->MaLichSuHang, 3)) + 1 : 1;

        LichSuHangThanhVien::create([
            'MaLichSuHang'           => 'LSH' . str_pad($soLSH, 3, '0', STR_PAD_LEFT),
            'MaKhachHang'            => $khachHang->MaKhachHang,
            'MaHangThanhVienCu'      => $maHangCu,
            'MaHangThanhVienMoi'     => $hangMoi->MaHangThanhVien,
            'ThoiGianThayDoi'        => now(),
            'LyDoThayDoi'            => 'Đủ điều kiện lên hạng ' . $hangMoi->TenHang,
            'DiemTaiThoiDiemTH'      => (string) $khachHang->TongDiem,
            'TongChiTieuTaiThoiDiem' => $tongChiTieu,
        ]);

        $this->taoThongBao(
            maKH:    $khachHang->MaKhachHang,
            tieuDe:  'Chúc mừng! Bạn đã lên hạng ' . $hangMoi->TenHang,
            noiDung: "Tài khoản của bạn đã được nâng lên hạng {$hangMoi->TenHang}. Chúc mừng!"
        );
    }

    /**
     * Ghi lịch sử giao dịch điểm
     */
    private function ghiLichSuGiaoDich(
        string $loai,
        int    $soDiem,
        int    $truoc,
        int    $sau,
        string $maKH,
        string $maThamChieu
    ): void {
        $last  = LichSuGiaoDichDiem::orderBy('MaGiaoDichDiem', 'desc')->first();
        $soGDD = $last ? ((int) substr($last->MaGiaoDichDiem, 3)) + 1 : 1;

        LichSuGiaoDichDiem::create([
            'MaGiaoDichDiem'   => 'GDD' . str_pad($soGDD, 3, '0', STR_PAD_LEFT),
            'LoaiGiaoDich'     => $loai,
            'SoDiem'           => $soDiem,
            'SoDiemTruoc'      => $truoc,
            'SoDiemSau'        => $sau,
            'MaKhachHang'      => $maKH,
            'MaThamChieu'      => $maThamChieu,
            'ThoiGianGiaoDich' => now()->format('Y-m-d'),
        ]);
    }

    /**
     * Tạo thông báo cho khách hàng
     */
    private function taoThongBao(string $maKH, string $tieuDe, string $noiDung): void
    {
        $last = Thongbao::orderBy('MaThongBao', 'desc')->first();
        $soTB = $last ? ((int) substr($last->MaThongBao, 2)) + 1 : 1;

        Thongbao::create([
            'MaThongBao'  => 'TB' . str_pad($soTB, 3, '0', STR_PAD_LEFT),
            'TieuDe'      => $tieuDe,
            'NoiDung'     => $noiDung,
            'ThoiGian'    => now(),
            'TrangThai'   => 'ChuaDoc',
            'MaKhachHang' => $maKH,
        ]);
    }
}