<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use App\Models\ChiTietHoaDon;
use App\Models\KhachHang;
use App\Models\LoaiVe;
use App\Models\VoucherKhachHang;
use App\Models\LichSuGiaoDichDiem;
use App\Models\LichSuHangThanhVien;
use App\Models\HangThanhVien;
use App\Models\Thongbao;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HoaDonController extends Controller
{
    /**
     * Lấy danh sách loại vé đang hoạt động
     */
    public function getLoaiVe()
    {
        $loaiVe = LoaiVe::where('TrangThai', 'HoatDong')->get();

        return response()->json([
            'success' => true,
            'data' => $loaiVe
        ]);
    }

    /**
     * Tra cứu khách hàng theo số điện thoại
     * Trả về thông tin KH + danh sách voucher có thể dùng
     */
    public function lookupKhachHang(Request $request)
    {
        $request->validate([
            'so_dien_thoai' => 'required|string'
        ]);

        $khachHang = KhachHang::with('hangThanhVien')
            ->where('SoDienThoai', $request->so_dien_thoai)
            ->where('TrangThai', 'HoatDong')
            ->first();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khách hàng hoặc tài khoản đã bị khóa'
            ], 404);
        }

        // Lấy voucher còn hiệu lực của khách hàng
        $vouchers = VoucherKhachHang::with('uuDai')
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'ChuaSuDung')
            ->where('NgayHetHan', '>=', now()->format('Y-m-d'))
            ->get()
            ->map(function ($v) {
                return [
                    'MaVoucherKhachHang' => $v->MaVoucherKhachHang,
                    'TenUuDai'           => $v->uuDai->TenUuDai,
                    'GiaTriGiam'         => $v->uuDai->GiaTriGiam,
                    'NhomUuDai'          => $v->uuDai->NhomUuDai,
                    'CoTheDungChung'     => $v->uuDai->CoTheDungChung,
                    'ThuTuApDung'        => $v->uuDai->ThuTuApDung,
                    'NgayHetHan'         => $v->NgayHetHan,
                    'MoTa'               => $v->uuDai->MoTa,
                ];
            });

        return response()->json([
            'success'   => true,
            'khachHang' => [
                'MaKhachHang'     => $khachHang->MaKhachHang,
                'HoTen'           => $khachHang->HoTen,
                'SoDienThoai'     => $khachHang->SoDienThoai,
                'TongDiem'        => $khachHang->TongDiem,
                'TenHang'         => $khachHang->hangThanhVien->TenHang ?? '',
                'MaHangThanhVien' => $khachHang->MaHangThanhVien,
            ],
            'vouchers' => $vouchers
        ]);
    }

    /**
     * Tạo hóa đơn
     */
    public function taoHoaDon(Request $request)
    {
        $request->validate([
            'chi_tiet'             => 'required|array|min:1',
            'chi_tiet.*.MaLoaiVe' => 'required|string|exists:loaive,MaLoaiVe',
            'chi_tiet.*.SoLuong'  => 'required|integer|min:1',
            'ma_khach_hang'        => 'nullable|string|exists:khachhang,MaKhachHang',
            'vouchers_ap_dung'     => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $nhanVien = auth('nhanvien')->user();

            // --- Tính tổng tiền gốc ---
            $tongTienGoc = 0;
            $chiTietData = [];

            foreach ($request->chi_tiet as $item) {
                $loaiVe = LoaiVe::find($item['MaLoaiVe']);
                if (!$loaiVe || $loaiVe->TrangThai !== 'HoatDong') {
                    return response()->json([
                        'success' => false,
                        'message' => "Loại vé {$item['MaLoaiVe']} không khả dụng"
                    ], 422);
                }
                $thanh = $loaiVe->GiaVe * $item['SoLuong'];
                $tongTienGoc += $thanh;
                $chiTietData[] = [
                    'loaiVe'   => $loaiVe,
                    'SoLuong'  => $item['SoLuong'],
                    'DonGia'   => $loaiVe->GiaVe,
                ];
            }

            // --- Xử lý voucher ---
            $tongGiam      = 0;
            $maVoucherList = [];
            $khachHang     = null;
            $diemSuDung    = 0;

            if ($request->ma_khach_hang) {
                $khachHang = KhachHang::with(['hangThanhVien.quyTac'])->find($request->ma_khach_hang);

                if ($request->filled('vouchers_ap_dung')) {
                    $vouchersApDung = VoucherKhachHang::with('uuDai')
                        ->whereIn('MaVoucherKhachHang', $request->vouchers_ap_dung)
                        ->where('MaKhachHang', $khachHang->MaKhachHang)
                        ->where('TrangThai', 'ChuaSuDung')
                        ->where('NgayHetHan', '>=', now()->format('Y-m-d'))
                        ->get();

                    // Nhóm voucher theo nhóm để kiểm tra CoTheDungChung
                    $nhomDaSuDung = [];
                    $sortedVouchers = $vouchersApDung->sortBy('uuDai.ThuTuApDung');

                    foreach ($sortedVouchers as $v) {
                        $nhom = $v->uuDai->NhomUuDai;
                        $dungChung = $v->uuDai->CoTheDungChung;

                        // Nếu nhóm đã có voucher và không cho dùng chung → bỏ qua
                        if (isset($nhomDaSuDung[$nhom]) && !$dungChung) {
                            continue;
                        }

                        // Tính giá trị giảm
                        if ($v->uuDai->NhomUuDai === 'PhanTram') {
                            $giam = $tongTienGoc * ($v->uuDai->GiaTriGiam / 100);
                        } else {
                            $giam = $v->uuDai->GiaTriGiam;
                        }

                        $tongGiam += $giam;
                        $nhomDaSuDung[$nhom] = true;
                        $maVoucherList[] = $v->MaVoucherKhachHang;
                    }
                }
            }

            $tongThanhToan = max(0, $tongTienGoc - $tongGiam);

            // --- Sinh mã hóa đơn ---
            $lastHD = HoaDon::orderBy('MaHoaDon', 'desc')->first();
            $soHD   = $lastHD ? ((int) substr($lastHD->MaHoaDon, 2)) + 1 : 1;
            $maHD   = 'HD' . str_pad($soHD, 3, '0', STR_PAD_LEFT);

            // --- Tính điểm tích lũy ---
            $diemTichLuy = 0;
            $maQuyTac    = null;
            $maHang      = null;

            if ($khachHang) {
                $quyTac = $khachHang->hangThanhVien->quyTac ?? null;
                if ($quyTac && $quyTac->TrangThai === 'HoatDong') {
                    $diemTichLuy = (int) floor($tongThanhToan / $quyTac->SoTienQuyDoi) * $quyTac->SoDiemNhan;
                    $maQuyTac    = $quyTac->MaQuyTac;
                }
                $maHang = $khachHang->MaHangThanhVien;
            }

            // --- Tạo hóa đơn ---
            $hoaDon = HoaDon::create([
                'MaHoaDon'         => $maHD,
                'NgayLap'          => now(),
                'TongTien'         => $tongThanhToan,
                'DiemSuDung'       => $diemSuDung,
                'DiemTichLuy'      => $diemTichLuy,
                'TrangThai'        => 'DaThanhToan',
                'MaNhanVien'       => $nhanVien->MaNhanVien,
                'MaKhachHang'      => $khachHang?->MaKhachHang,
                'MaQuyTacHienTai'  => $maQuyTac,
                'MaHangThanhVien'  => $maHang,
                'MaVoucher'        => implode(',', $maVoucherList) ?: null,
            ]);

            // --- Chi tiết hóa đơn ---
            $soChiTiet = ChiTietHoaDon::orderBy('MaChiTietHD', 'desc')->first();
            $soCT      = $soChiTiet ? ((int) substr($soChiTiet->MaChiTietHD, 4)) + 1 : 1;

            foreach ($chiTietData as $ct) {
                ChiTietHoaDon::create([
                    'MaChiTietHD' => 'CTHD' . str_pad($soCT++, 3, '0', STR_PAD_LEFT),
                    'SoLuong'     => $ct['SoLuong'],
                    'DonGia'      => $ct['DonGia'],
                    'MaHoaDon'    => $maHD,
                    'MaLoaiVe'    => $ct['loaiVe']->MaLoaiVe,
                ]);
            }

            // --- Cập nhật voucher đã dùng ---
            if (!empty($maVoucherList)) {
                VoucherKhachHang::whereIn('MaVoucherKhachHang', $maVoucherList)->update([
                    'TrangThai'   => 'DaSuDung',
                    'NgaySuDung'  => now()->format('Y-m-d'),
                ]);
            }

            // --- Cập nhật điểm khách hàng & lịch sử ---
            if ($khachHang && $diemTichLuy > 0) {
                $diemTruoc = $khachHang->TongDiem;
                $diemSau   = $diemTruoc + $diemTichLuy;

                $khachHang->increment('TongDiem', $diemTichLuy);

                // Sinh mã giao dịch điểm
                $lastGDD = LichSuGiaoDichDiem::orderBy('MaGiaoDichDiem', 'desc')->first();
                $soGDD   = $lastGDD ? ((int) substr($lastGDD->MaGiaoDichDiem, 3)) + 1 : 1;

                LichSuGiaoDichDiem::create([
                    'MaGiaoDichDiem'   => 'GDD' . str_pad($soGDD, 3, '0', STR_PAD_LEFT),
                    'LoaiGiaoDich'     => 'CongDiemHoaDon',
                    'SoDiem'           => $diemTichLuy,
                    'SoDiemTruoc'      => $diemTruoc,
                    'SoDiemSau'        => $diemSau,
                    'MaKhachHang'      => $khachHang->MaKhachHang,
                    'MaThamChieu'      => $maHD,
                    'ThoiGianGiaoDich' => now()->format('Y-m-d'),
                ]);

                // Kiểm tra lên hạng
                $this->kiemTraLenHang($khachHang, $nhanVien->MaNhanVien);

                // Thông báo
                $lastTB = Thongbao::orderBy('MaThongBao', 'desc')->first();
                $soTB   = $lastTB ? ((int) substr($lastTB->MaThongBao, 2)) + 1 : 1;

                Thongbao::create([
                    'MaThongBao'  => 'TB' . str_pad($soTB, 3, '0', STR_PAD_LEFT),
                    'TieuDe'      => 'Tích điểm thành công',
                    'NoiDung'     => "Bạn đã được cộng {$diemTichLuy} điểm từ hóa đơn {$maHD}.",
                    'ThoiGian'    => now(),
                    'TrangThai'   => 'ChuaDoc',
                    'MaKhachHang' => $khachHang->MaKhachHang,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo hóa đơn thành công',
                'data'    => [
                    'MaHoaDon'      => $maHD,
                    'TongTienGoc'   => $tongTienGoc,
                    'TongGiam'      => $tongGiam,
                    'TongThanhToan' => $tongThanhToan,
                    'DiemTichLuy'   => $diemTichLuy,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Kiểm tra và cập nhật hạng thành viên nếu đủ điều kiện
     */
    private function kiemTraLenHang(KhachHang $khachHang, string $maNhanVien): void
    {
        $khachHang->refresh();

        $hangMoi = HangThanhVien::where('DiemToiThieu', '<=', $khachHang->TongDiem)
            ->where('ThuTuHang', '>', optional(
                HangThanhVien::find($khachHang->MaHangThanhVien)
            )->ThuTuHang ?? 0)
            ->orderBy('ThuTuHang', 'desc')
            ->first();

        if ($hangMoi) {
            $maHangCu = $khachHang->MaHangThanhVien;

            $khachHang->update(['MaHangThanhVien' => $hangMoi->MaHangThanhVien]);

            $lastLSH = LichSuHangThanhVien::orderBy('MaLichSuHang', 'desc')->first();
            $soLSH   = $lastLSH ? ((int) substr($lastLSH->MaLichSuHang, 3)) + 1 : 1;

            LichSuHangThanhVien::create([
                'MaLichSuHang'       => 'LSH' . str_pad($soLSH, 3, '0', STR_PAD_LEFT),
                'MaKhachHang'        => $khachHang->MaKhachHang,
                'MaHangThanhVienCu'  => $maHangCu,
                'MaHangThanhVienMoi' => $hangMoi->MaHangThanhVien,
                'ThoiGianThayDoi'    => now(),
                'LyDoThayDoi'        => 'Đủ điều kiện lên hạng ' . $hangMoi->TenHang,
                'DiemTaiThoiDiemTH'  => (string) $khachHang->TongDiem,
                'TongChiTieuTaiThoiDiem' => 0,
            ]);

            // Thông báo lên hạng
            $lastTB = Thongbao::orderBy('MaThongBao', 'desc')->first();
            $soTB   = $lastTB ? ((int) substr($lastTB->MaThongBao, 2)) + 1 : 1;

            Thongbao::create([
                'MaThongBao'  => 'TB' . str_pad($soTB, 3, '0', STR_PAD_LEFT),
                'TieuDe'      => 'Chúc mừng! Bạn đã lên hạng ' . $hangMoi->TenHang,
                'NoiDung'     => "Tài khoản của bạn đã được nâng lên hạng {$hangMoi->TenHang}. Chúc mừng!",
                'ThoiGian'    => now(),
                'TrangThai'   => 'ChuaDoc',
                'MaKhachHang' => $khachHang->MaKhachHang,
            ]);
        }
    }

    /**
     * Xem chi tiết hóa đơn
     */
    public function chiTietHoaDon(string $maHoaDon)
    {
        $hoaDon = HoaDon::with([
            'chiTietHoaDon.loaiVe',
            'khachHang',
            'nhanVien',
            'hangThanhVien',
        ])->find($maHoaDon);

        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }

        return response()->json(['success' => true, 'data' => $hoaDon]);
    }
}