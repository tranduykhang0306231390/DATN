import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import HomeBanner from "../../components/member/HomeBanner";
import TicketHot from "../../components/member/TicketHot";
import VoucherHot from "../../components/member/VoucherHot";

import "../../assets/css/memberHome.css";

function MemberHome() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    useEffect(() => {

        const data = JSON.parse(localStorage.getItem("user"));

        if (!data) {

            navigate("/login");
            return;

        }

        setUser(data);

    }, [navigate]);

    if (!user) return null;

    return (

        <div className="container">

            {/* Banner */}

            <HomeBanner />

            {/* Vé HOT & Voucher HOT */}

            <div className="row g-4">

                <div className="col-lg-7">

                    <TicketHot />

                </div>

                <div className="col-lg-5">

                    <VoucherHot />

                </div>

            </div>

        </div>

    );

}

export default MemberHome;