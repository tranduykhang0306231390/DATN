<?php
// app/Services/DiemTichLuyService.php
// Tách toàn bộ logic điểm ra đây để tái sử dụng ở nhiều nơi

namespace App\Services;

use App\Models\KhachHang;
use App\Models\HangThanhVien;
use App\Models\LichSuGiaoDichDiem;
use App\Models\LichSuHangThanhVien;
use App\Models\Thongbao;

class DiemTichLuyService
{
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
            'TongChiTieuTaiThoiDiem' => 0,
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