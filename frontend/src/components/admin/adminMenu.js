
export const ADMIN_MENU = [
    {
        key: 'van-hanh',
        eyebrow: 'Hằng ngày',
        title: 'Vận hành',
        items: [
            {
                icon: '🧾',
                label: 'Quản lý hóa đơn',
                desc: 'Tra cứu, xem chi tiết & trạng thái hóa đơn',
                path: '/admin/quan-ly-hoa-don',
                color: '#3b82f6',
            },
            {
                icon: '🎫',
                label: 'Loại vé',
                desc: 'Thêm, sửa giá và trạng thái vé buffet',
                path: '/admin/loai-ve',
                color: '#0ea5e9',
            },
        ],
    },
    {
        key: 'khach-hang',
        eyebrow: 'Chăm sóc',
        title: 'Khách hàng & thành viên',
        items: [
            {
                icon: '👥',
                label: 'Tra cứu khách hàng',
                desc: 'Xem hồ sơ, điểm và lịch sử của khách',
                path: '/admin/khach-hang',
                color: '#8b5cf6',
            },
            {
                icon: '🏆',
                label: 'Hạng thành viên',
                desc: 'Cấu hình các hạng và điều kiện lên hạng',
                path: '/admin/hang-thanh-vien',
                color: '#f59e0b',
            },
            {
                icon: '💬',
                label: 'Phản hồi khách hàng',
                desc: 'Xem và xử lý đánh giá từ khách',
                path: '/admin/phan-hoi',
                color: '#ec4899',
            },
        ],
    },
    {
        key: 'uu-dai',
        eyebrow: 'Khuyến mãi',
        title: 'Ưu đãi & tích điểm',
        items: [
            {
                icon: '🎁',
                label: 'Ưu đãi & Voucher',
                desc: 'Tạo và phát hành ưu đãi cho khách',
                path: '/admin/uu-dai',
                color: '#10b981',
            },
            {
                icon: '⚙️',
                label: 'Quy tắc tích điểm',
                desc: 'Cấu hình mức quy đổi tiền ra điểm',
                path: '/admin/quy-tac-tich-diem',
                color: '#14b8a6',
            },
        ],
    },
    {
        key: 'he-thong',
        eyebrow: 'Quản trị',
        title: 'Hệ thống',
        items: [
            {
                icon: '👷',
                label: 'Quản lý nhân viên',
                desc: 'Tài khoản, vai trò và trạng thái nhân viên',
                path: '/admin/nhan-vien',
                color: '#6366f1',
            },
            {
                icon: '📊',
                label: 'Thống kê & báo cáo',
                desc: 'Doanh thu, hóa đơn và điểm theo thời gian',
                path: '/admin/thong-ke',
                color: '#f43f5e',
            },
        ],
    },
];

// Cấu hình các ô số liệu tổng quan hiển thị đầu trang.
// `value` để null -> hiển thị "—" cho tới khi bạn nối API (xem AdminDashboard.jsx).
// export const ADMIN_STATS = [
//     { key: 'doanhThuHomNay', icon: '💰', label: 'Doanh thu hôm nay', hint: 'Hóa đơn đã thanh toán', color: '#10b981' },
//     { key: 'hoaDonHomNay', icon: '🧾', label: 'Hóa đơn hôm nay', hint: 'Số hóa đơn được lập', color: '#3b82f6' },
//     { key: 'tongKhachHang', icon: '👥', label: 'Khách hàng', hint: 'Đang hoạt động', color: '#8b5cf6' },
//     { key: 'uuDaiDangChay', icon: '🎁', label: 'Ưu đãi đang chạy', hint: 'Còn hiệu lực', color: '#f59e0b' },
// ];