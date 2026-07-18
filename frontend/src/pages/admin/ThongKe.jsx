// src/pages/admin/ThongKe.jsx
import { useEffect, useState, useCallback } from 'react';
import '../../assets/css/admin.css';
import thongKeApi from '../../api/thongKeApi';
import AdminDateInput from '../../components/admin/AdminDateInput';

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const fmtNum = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

const dateStr = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
};

const KHOANG_NHANH = [
    { label: '7 ngày', days: 6 },
    { label: '30 ngày', days: 29 },
    { label: '90 ngày', days: 89 },
];

export default function ThongKe() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tuNgay, setTuNgay] = useState(dateStr(29));
    const [denNgay, setDenNgay] = useState(dateStr(0));

    const loadData = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        thongKeApi
            .chiTiet({ tu_ngay: tuNgay, den_ngay: denNgay })
            .then((res) => {
                if (res.data?.success) setData(res.data.data);
            })
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [tuNgay, denNgay]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void loadData(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadData]);

    const chonKhoang = (days) => {
        setTuNgay(dateStr(days));
        setDenNgay(dateStr(0));
    };

    const th = data?.tong_hop;
    const topVe = data?.top_loai_ve || [];
    const phanBo = data?.phan_bo_hang || [];

    const maxVe = Math.max(...topVe.map((v) => Number(v.so_luong)), 1);
    const tongKhach = phanBo.reduce((s, h) => s + Number(h.so_khach), 0) || 1;

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Quản trị</span>
                    <h2 className="admin-hero-title">Thống kê &amp; báo cáo</h2>
                </div>
            </header>

            {/* Chọn khoảng thời gian */}
            <div className="admin-toolbar">
                <AdminDateInput
                    style={{ flex: '0 0 160px' }}
                    value={tuNgay}
                    max={denNgay}
                    onChange={(v) => setTuNgay(v)}
                />
                <AdminDateInput
                    style={{ flex: '0 0 160px' }}
                    value={denNgay}
                    min={tuNgay}
                    max={dateStr(0)}
                    onChange={(v) => setDenNgay(v)}
                />
                {KHOANG_NHANH.map((k) => (
                    <button
                        key={k.label}
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        onClick={() => chonKhoang(k.days)}
                    >
                        {k.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="admin-table-wrap">
                    <div className="admin-state">Đang tải số liệu…</div>
                </div>
            ) : !data ? (
                <div className="admin-table-wrap">
                    <div className="admin-state">Không tải được số liệu.</div>
                </div>
            ) : (
                <>
                    {/* Số liệu tổng hợp */}
                    <div className="admin-stats">
                        <div className="admin-stat" style={{ '--stat-accent': '#10b981' }}>
                            <div className="admin-stat-head">
                                <span className="admin-stat-label">Tổng doanh thu</span>
                            </div>
                            <div className="admin-stat-value">{fmtMoney(th.tong_doanh_thu)}</div>
                            <div className="admin-stat-hint">Hóa đơn đã thanh toán</div>
                        </div>

                        <div className="admin-stat" style={{ '--stat-accent': '#3b82f6' }}>
                            <div className="admin-stat-head">
                                <span className="admin-stat-label">Số hóa đơn</span>
                            </div>
                            <div className="admin-stat-value">{fmtNum(th.so_hoa_don)}</div>
                            <div className="admin-stat-hint">{fmtNum(th.so_hoa_don_huy)} hóa đơn đã hủy</div>
                        </div>

                        <div className="admin-stat" style={{ '--stat-accent': '#8b5cf6' }}>
                            <div className="admin-stat-head">
                                <span className="admin-stat-label">Trung bình / hóa đơn</span>
                            </div>
                            <div className="admin-stat-value">{fmtMoney(th.trung_binh_hoa_don)}</div>
                            <div className="admin-stat-hint">Giá trị mỗi lần mua</div>
                        </div>

                        <div className="admin-stat" style={{ '--stat-accent': '#f59e0b' }}>
                            <div className="admin-stat-head">
                                <span className="admin-stat-label">Điểm đã phát</span>
                            </div>
                            <div className="admin-stat-value">{fmtNum(th.tong_diem_phat)}</div>
                            <div className="admin-stat-hint">Tích lũy cho khách</div>
                        </div>
                    </div>



                    {/* Top loại vé */}
                    <section className="admin-section">
                        <header className="admin-section-head">
                            <span className="admin-section-eyebrow">Bán chạy</span>
                            <h3 className="admin-section-title">Top 5 loại vé</h3>
                        </header>

                        <div className="admin-table-wrap">
                            <table className="admin-table" style={{ minWidth: 600 }}>
                                <thead>
                                    <tr>
                                        <th>Loại vé</th>
                                        <th style={{ width: '40%' }}>Số lượng bán</th>
                                        <th>Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topVe.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="admin-state">Chưa có dữ liệu.</td>
                                        </tr>
                                    ) : (
                                        topVe.map((v) => (
                                            <tr key={v.MaLoaiVe}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{v.TenLoaiVe}</div>
                                                    <div className="admin-mono" style={{ fontSize: 12 }}>
                                                        {v.MaLoaiVe}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div
                                                            style={{
                                                                flex: 1,
                                                                height: 8,
                                                                background: '#eef0f6',
                                                                borderRadius: 999,
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${(Number(v.so_luong) / maxVe) * 100}%`,
                                                                    height: '100%',
                                                                    background: '#4f46e5',
                                                                }}
                                                            />
                                                        </div>
                                                        <b style={{ minWidth: 40 }}>{fmtNum(v.so_luong)}</b>
                                                    </div>
                                                </td>
                                                <td>{fmtMoney(v.doanh_thu)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Phân bố hạng */}
                    <section className="admin-section">
                        <header className="admin-section-head">
                            <span className="admin-section-eyebrow">Thành viên</span>
                            <h3 className="admin-section-title">Phân bố khách theo hạng</h3>
                        </header>

                        <div className="admin-table-wrap">
                            <table className="admin-table" style={{ minWidth: 600 }}>
                                <thead>
                                    <tr>
                                        <th>Hạng</th>
                                        <th style={{ width: '50%' }}>Tỷ lệ</th>
                                        <th>Số khách</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {phanBo.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="admin-state">Chưa có dữ liệu.</td>
                                        </tr>
                                    ) : (
                                        phanBo.map((h) => {
                                            const pct = (Number(h.so_khach) / tongKhach) * 100;
                                            return (
                                                <tr key={h.TenHang}>
                                                    <td style={{ fontWeight: 600 }}>{h.TenHang}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                    height: 8,
                                                                    background: '#eef0f6',
                                                                    borderRadius: 999,
                                                                    overflow: 'hidden',
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: `${pct}%`,
                                                                        height: '100%',
                                                                        background: '#f59e0b',
                                                                    }}
                                                                />
                                                            </div>
                                                            <span style={{ fontSize: 13, color: '#64748b', minWidth: 44 }}>
                                                                {pct.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>{fmtNum(h.so_khach)}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
