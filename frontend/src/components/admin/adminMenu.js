
export const ADMIN_MENU = [
    {
        key: 'van-hanh',
        title: 'Vận hành',
        items: [
            {
                icon: '🧾',
                label: 'Quản lý hóa đơn',
                path: '/admin/quan-ly-hoa-don',
                color: '#3b82f6',
            },
            {
                icon: '🎫',
                label: 'Loại vé',
                path: '/admin/loai-ve',
                color: '#0ea5e9',
            },
        ],
    },
    {
        key: 'khach-hang',
        title: 'Khách hàng & thành viên',
        items: [
            {
                icon: '👥',
                label: 'QUản lỹ khách hàng',
                path: '/admin/khach-hang',
                color: '#8b5cf6',
            },
            {
                icon: '🏆',
                label: 'Hạng thành viên',
                path: '/admin/hang-thanh-vien',
                color: '#f59e0b',
            },
            {
                icon: '💬',
                label: 'Phản hồi khách hàng',
                path: '/admin/phan-hoi',
                color: '#ec4899',
            },
        ],
    },
    {
        key: 'uu-dai',
        title: 'Ưu đãi & tích điểm',
        items: [
            {
                icon: '🎁',
                label: 'Ưu đãi & Voucher',
                path: '/admin/uu-dai',
                color: '#10b981',
            },
            {
                icon: '⚙️',
                label: 'Quy tắc tích điểm',
                path: '/admin/quy-tac',
                color: '#14b8a6',
            },
        ],
    },
    {
        key: 'he-thong',
        title: 'Hệ thống',
        items: [
            {
                icon: '👷',
                label: 'Quản lý nhân viên',
                path: '/admin/nhan-vien',
                color: '#6366f1',
            },
            {
                icon: '📊',
                label: 'Thống kê & báo cáo',
                path: '/admin/thong-ke',
                color: '#f43f5e',
            },
        ],
    },
    {
        key: 'lich-su',
        title: 'Lịch sử',
        items: [
            {
                icon: '🧾',
                label: 'lịch sử thây đổi quy tắc',
                path: '/admin/lich-su-quy-tac',
                color: '#6366f1',
            },
            {
                icon: '🧾',
                label: 'LỊCH SỬ THAY ĐỔI HẠNG THÀNH VIÊN',
                path: '/admin/nhan-vien',
                color: '#6366f1',
            },
        ],
    },
];
export const ADMIN_STATS = [
    { key: 'doanhThuHomNay', icon: '💰', label: 'Doanh thu hôm nay', hint: 'Hóa đơn đã thanh toán', color: '#10b981' },
    { key: 'hoaDonHomNay', icon: '🧾', label: 'Hóa đơn hôm nay', hint: 'Số hóa đơn được lập', color: '#3b82f6' },
    { key: 'tongKhachHang', icon: '👥', label: 'Khách hàng', hint: 'Đang hoạt động', color: '#8b5cf6' },
    { key: 'uuDaiDangChay', icon: '🎁', label: 'Ưu đãi đang chạy', hint: 'Còn hiệu lực', color: '#f59e0b' },
];
