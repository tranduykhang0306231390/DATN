import { useEffect, useState } from "react";
import { getHotVoucher } from "../../api/authApi";
import VoucherHotCard from "./VoucherHotCard";
import "../../assets/css/voucherhot.css";

function VoucherHot() {

    const [vouchers, setVouchers] = useState([]);

    useEffect(() => {
        loadVoucher();
    }, []);

    const loadVoucher = async () => {

        try {

            const res = await getHotVoucher();

            setVouchers(res.data.data || []);

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <section className="home-section">

            <div className="section-header d-flex justify-content-between align-items-center mb-3">

                <h2 className="section-title">
                    Voucher hot đang chờ bạn !
                </h2>

            </div>

            <div className="row">

                {

                    vouchers.map(voucher => (

                        <div
                            className="col-md-6 mb-3"
                            key={voucher.MaUuDai}
                        >

                            <VoucherHotCard
                                voucher={voucher}
                            />

                        </div>

                    ))

                }

            </div>

        </section>

    );

}

export default VoucherHot;