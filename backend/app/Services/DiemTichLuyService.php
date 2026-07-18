<?php
// app/Services/DiemTichLuyService.php
// Tách toàn bộ logic điểm ra đây để tái sử dụng ở nhiều nơi

namespace App\Services;

use App\Models\KhachHang;
use App\Models\HangThanhVien;
use App\Models\LichSuGiaoDichDiem;
use App\Models\LichSuHangThanhVien;
use App\Models\ThongBao;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DiemTichLuyService
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

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
     * Thu hồi điểm đã cộng khi hủy hóa đơn.
     *
     * Giữ tên method cũ để tương thích với caller nếu luồng hủy được bật lại.
     *
     * @return array{MaHangThanhVienMoi: string, TenHangMoi: string}|null
     *         Thông tin hạng mới nếu khách bị hạ hạng do hoàn điểm, null nếu không.
     */
    public function hoanDiem(KhachHang $khachHang, int $soDiem, string $maThamChieu): ?array
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
            tieuDe:  'Điều chỉnh điểm do hủy hóa đơn',
            noiDung: "Hóa đơn {$maThamChieu} đã bị hủy. {$soDiem} điểm tích lũy đã được thu hồi."
        );

        // Nếu khách lên hạng nhờ chính số điểm vừa bị hoàn lại, đảo ngược
        // luôn việc lên hạng đó — khác với congDiem() chỉ tự động NÂNG,
        // hoanDiem() cần tự động HẠ vì đây là đảo ngược 1 giao dịch đã xảy
        // ra (hủy hóa đơn), không phải khách chủ động tiêu điểm.
        return $this->kiemTraHaHang($khachHang, $maThamChieu);
    }

    /**
     * Hạng "xứng đáng" nhất với số điểm hiện có, không quan tâm hạng hiện
     * tại đang là gì (dùng chung cho cả kiểm tra lên hạng lẫn hạ hạng).
     */
    private function hangXungDangTheoDiem(int $tongDiem): ?HangThanhVien
    {
        return HangThanhVien::where('DiemToiThieu', '<=', $tongDiem)
            ->orderBy('ThuTuHang', 'desc')
            ->first();
    }

    /**
     * Kiểm tra và cập nhật hạng thành viên
     */
    private function kiemTraLenHang(KhachHang $khachHang): void
    {
        $khachHang->refresh();

        $hangHienTai = HangThanhVien::find($khachHang->MaHangThanhVien);
        $hangMoi     = $this->hangXungDangTheoDiem((int) $khachHang->TongDiem);

        if (!$hangMoi || $hangMoi->ThuTuHang <= ($hangHienTai->ThuTuHang ?? 0)) return;

        $maHangCu = $khachHang->MaHangThanhVien;
        $khachHang->update(['MaHangThanhVien' => $hangMoi->MaHangThanhVien]);

        // Tổng chi tiêu thực của khách tại thời điểm lên hạng
        $tongChiTieu = (float) DB::table('hoadon')
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'DaThanhToan')
            ->sum('TongTien');

        // Lịch sử thay đổi hạng
        LichSuHangThanhVien::create([
            'MaLichSuHang'           => $this->codes->next(
                'lichsuhangthanhvien',
                'MaLichSuHang',
                'LSH'
            ),
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
     * Hạ hạng nếu sau khi hoàn điểm (huỷ hóa đơn), khách không còn đủ điểm
     * để giữ hạng hiện tại. Chỉ gọi từ hoanDiem() — không dùng cho trường
     * hợp khách chủ động tiêu điểm (đổi voucher), vì đó là lựa chọn của
     * khách chứ không phải đảo ngược một giao dịch đã xảy ra.
     */
    private function kiemTraHaHang(KhachHang $khachHang, string $maThamChieu): ?array
    {
        $khachHang->refresh();

        $hangHienTai = HangThanhVien::find($khachHang->MaHangThanhVien);
        if (!$hangHienTai) return null;

        $hangXungDang = $this->hangXungDangTheoDiem((int) $khachHang->TongDiem);
        if (!$hangXungDang || $hangXungDang->ThuTuHang >= $hangHienTai->ThuTuHang) return null;

        $maHangCu = $khachHang->MaHangThanhVien;
        $khachHang->update(['MaHangThanhVien' => $hangXungDang->MaHangThanhVien]);

        $tongChiTieu = (float) DB::table('hoadon')
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'DaThanhToan')
            ->sum('TongTien');

        $lastLSH = LichSuHangThanhVien::orderBy('MaLichSuHang', 'desc')->first();
        $soLSH   = $lastLSH ? ((int) substr($lastLSH->MaLichSuHang, 3)) + 1 : 1;

        LichSuHangThanhVien::create([
            'MaLichSuHang'           => 'LSH' . str_pad($soLSH, 3, '0', STR_PAD_LEFT),
            'MaKhachHang'            => $khachHang->MaKhachHang,
            'MaHangThanhVienCu'      => $maHangCu,
            'MaHangThanhVienMoi'     => $hangXungDang->MaHangThanhVien,
            'ThoiGianThayDoi'        => now(),
            'LyDoThayDoi'            => "Hạ về hạng {$hangXungDang->TenHang} do hoàn điểm từ hóa đơn bị hủy {$maThamChieu}",
            'DiemTaiThoiDiemTH'      => (string) $khachHang->TongDiem,
            'TongChiTieuTaiThoiDiem' => $tongChiTieu,
        ]);

        $this->taoThongBao(
            maKH:    $khachHang->MaKhachHang,
            tieuDe:  'Điều chỉnh hạng thành viên',
            noiDung: "Do hóa đơn {$maThamChieu} đã bị hủy và hoàn điểm, hạng của bạn được điều chỉnh về {$hangXungDang->TenHang}."
        );

        return [
            'MaHangThanhVienMoi' => $hangXungDang->MaHangThanhVien,
            'TenHangMoi'         => $hangXungDang->TenHang,
        ];
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
        LichSuGiaoDichDiem::create([
            'MaGiaoDichDiem'   => $this->codes->next(
                'lichsugiaodichdiem',
                'MaGiaoDichDiem',
                'GDD'
            ),
            'LoaiGiaoDich'     => $loai,
            'SoDiem'           => $soDiem,
            'SoDiemTruoc'      => $truoc,
            'SoDiemSau'        => $sau,
            'MaKhachHang'      => $maKH,
            'MaThamChieu'      => $maThamChieu,
            'ThoiGianGiaoDich' => now(),
        ]);
    }

    /**
     * Tạo thông báo cho khách hàng
     */
    private function taoThongBao(string $maKH, string $tieuDe, string $noiDung): void
    {
        ThongBao::create([
            'MaThongBao'  => $this->codes->next('thongbao', 'MaThongBao', 'TB'),
            'TieuDe'      => $tieuDe,
            'NoiDung'     => $noiDung,
            'ThoiGian'    => now(),
            'TrangThai'   => 'ChuaDoc',
            'MaKhachHang' => $maKH,
        ]);
    }
}
