import { useEffect, useState } from "react";
import {
    getMyVoucher,
    getVoucherStore,
} from "../../api/authApi";

import MyVoucherList from "../../components/member/MyVoucherList";
import VoucherStoreList from "../../components/member/VoucherStoreList";

import "../../assets/css/member/Voucher.css";

function Voucher() {

    const [myVouchers, setMyVouchers] = useState([]);
    const [storeVouchers, setStoreVouchers] = useState([]);

    // Phân trang Voucher của tôi
    const [myVoucherLinks, setMyVoucherLinks] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (page = 1) => {

        try {

            setLoading(true);

            const [myVoucherRes, storeRes] = await Promise.all([
                getMyVoucher(page),
                getVoucherStore(),
            ]);

            setMyVouchers(myVoucherRes.data.data);

            // Lưu links phân trang
            setMyVoucherLinks(myVoucherRes.data.links);

            setStoreVouchers(storeRes.data.data);

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (

            <div className="voucher-loading">

                Đang tải dữ liệu...

            </div>

        );

    }

    return (

        <div className="voucher-page container py-4">

            <MyVoucherList
                vouchers={myVouchers}
                links={myVoucherLinks}
                onPageChange={loadData}
            />

            <VoucherStoreList
                vouchers={storeVouchers}
                reloadData={loadData}
            />

        </div>

    );

}

export default Voucher;