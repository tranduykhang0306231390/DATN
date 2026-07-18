import { Outlet } from "react-router-dom";

import CustomerLayout from "../components/customer/layout/CustomerLayout";

import "../assets/css/public.css";

function PublicLayout() {
    return (
        <CustomerLayout>
            <Outlet />
        </CustomerLayout>
    );
}

export default PublicLayout;
