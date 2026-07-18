import { Link } from "react-router-dom";

import {
    CustomerAuthLayout,
    MemberLoginForm,
} from "../../components/customer/auth";

function LoginMember() {
    return (
        <CustomerAuthLayout
            eyebrow="Chào mừng trở lại"
            title="Đăng nhập thành viên"
            description="Tiếp tục hành trình tích điểm và quản lý các quyền lợi của bạn."
            footer={
                <span>
                    Chưa có tài khoản?{" "}
                    <Link to="/register">Đăng ký thành viên</Link>
                </span>
            }
            compact
        >
            <MemberLoginForm />
        </CustomerAuthLayout>
    );
}

export default LoginMember;