export const STAFF_MENU = [
    {
        key: 'ban-hang',
        eyebrow: 'Hằng ngày',
        title: 'Bán hàng',
        items: [
            {
                
                label: 'Tạo hóa đơn',
                desc: 'Chọn bàn, lập hóa đơn tại quầy cho khách',
                path: '/staff/tao-hoa-don',
                color: '#3b82f6',
            },
            {

                label: 'Quản lý hóa đơn',
                desc: 'Xem và tra cứu lịch sử hóa đơn',
                path: '/staff/quan-ly-hoa-don',
                color: '#8b5cf6',
            },
            {

                label: 'Quản lý đặt bàn',
                desc: 'Xác nhận, từ chối và check-in đặt bàn trước',
                path: '/staff/quan-ly-dat-ban',
                color: '#f59e0b',
            },
            {

                label: 'Đăng ký khách hàng',
                desc: 'Tạo tài khoản hộ khách hàng, có xác minh OTP',
                path: '/staff/dang-ky-khach-hang',
                color: '#10b981',
            },
        ],
    },
];