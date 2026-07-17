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
    const [storeVoucherLinks, setStoreVoucherLinks] = useState([]);

    const [loading, setLoading] = useState(true);

    async function loadData(myPage = 1, storePage = 1) {

        try {

            setLoading(true);

            const [myVoucherRes, storeRes] = await Promise.all([
                getMyVoucher(myPage),
                getVoucherStore(storePage),
            ]);

            setMyVouchers(myVoucherRes.data.data);

            // Lưu links phân trang
            setMyVoucherLinks(myVoucherRes.data.links);

            setStoreVouchers(storeRes.data.data);
            setStoreVoucherLinks(storeRes.data.links);

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }

    }

    useEffect(() => {
        loadData(1, 1);
    }, []);

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
                onPageChange={(page) => loadData(page, 1)}
            />

            <VoucherStoreList
                vouchers={storeVouchers}
                links={storeVoucherLinks}
                onPageChange={(page) => loadData(1, page)}
                reloadData={() => loadData(1, 1)}
            />

        </div>

    );

}

export default Voucher;
