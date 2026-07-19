import { lazy, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import AccountNavigation from "../../components/member/AccountNavigation";
import LoadingSkeleton from "../../components/customer/ui/LoadingSkeleton";
import SectionHeading from "../../components/customer/ui/SectionHeading";
import useCrispChat from "../../hooks/useCrispChat";
import {
    getAccountNavigationKey,
    getAccountSearch,
    normalizeAccountModal,
    normalizeAccountTab,
} from "../../utils/accountCenter";
import { getStoredAuthRole, getStoredAuthToken } from "../../utils/customerSession";
import "../../assets/css/customer/member-rank.css";
import "../../assets/css/customer/account-center.css";

const RankOverviewPanel = lazy(() => import("../../components/member/RankOverviewPanel"));
const TicketPricingPanel = lazy(() => import("../../components/member/TicketPricingPanel"));
const VoucherPanel = lazy(() => import("../../components/member/VoucherPanel"));
const TransactionHistoryPanel = lazy(() => import("../../components/member/TransactionHistoryPanel"));
const DatBanPanel = lazy(() => import("../../components/member/DatBanPanel"));

const TAB_HEADINGS = {
    rank: {
        eyebrow: "Vibrant Rewards Club",
        title: "Hạng và điểm",
        description: "Thẻ thành viên, điểm hiện có và hành trình thăng hạng của bạn.",
    },
    tickets: {
        eyebrow: "Giá vé",
        title: "Các loại vé đang áp dụng",
        description: "Tham khảo giá và thông tin vé được lấy trực tiếp từ hệ thống.",
    },
    vouchers: {
        eyebrow: "Đổi điểm nhận quà",
        title: "Voucher thành viên",
        description: "Đổi điểm và quản lý voucher của bạn trong cùng một nơi.",
    },
    "my-vouchers": {
        eyebrow: "Đổi điểm nhận quà",
        title: "Voucher thành viên",
        description: "Đổi điểm và quản lý voucher của bạn trong cùng một nơi.",
    },
    transactions: {
        eyebrow: "Hoạt động tài khoản",
        title: "Lịch sử giao dịch",
        description: "Tra cứu hóa đơn và biến động điểm trong cùng một nơi.",
    },
    "dat-ban": {
        eyebrow: "Đặt bàn trước",
        title: "Đặt bàn",
        description: "Giữ chỗ trước và theo dõi các lượt đặt bàn của bạn.",
    },
};

function AccountPanelLoading() {
    return (
        <div className="account-center-loading" role="status" aria-label="Đang tải nội dung tài khoản">
            <LoadingSkeleton lines={5} ariaLabel="Đang tải nội dung" />
            <LoadingSkeleton lines={4} ariaLabel="Đang tải dữ liệu" />
        </div>
    );
}

function MemberRank() {
    const [searchParams, setSearchParams] = useSearchParams();
    const contentRef = useRef(null);
    const previousTabRef = useRef(null);
    const requestedTab = searchParams.get("tab");
    const activeTab = normalizeAccountTab(requestedTab);
    const activeModal = normalizeAccountModal(searchParams.get("modal"), activeTab);
    const heading = TAB_HEADINGS[activeTab];
    const activeNavigationKey = getAccountNavigationKey(activeTab, activeModal);

    const isLoggedIn = Boolean(getStoredAuthToken()) && getStoredAuthRole() === "member";
    useCrispChat(isLoggedIn);

    useEffect(() => {
        const hasInvalidTab = requestedTab !== null && requestedTab !== activeTab;
        const requestedModal = searchParams.get("modal");
        const hasInvalidModal = requestedModal !== null && requestedModal !== activeModal;

        if (!hasInvalidTab && !hasInvalidModal) return;
        setSearchParams(getAccountSearch({ tab: activeTab, modal: activeModal }), { replace: true });
    }, [activeModal, activeTab, requestedTab, searchParams, setSearchParams]);

    useEffect(() => {
        if (previousTabRef.current === null) {
            previousTabRef.current = activeTab;
            return;
        }
        if (previousTabRef.current === activeTab) return;

        previousTabRef.current = activeTab;
        contentRef.current?.scrollIntoView({ block: "start" });
    }, [activeTab]);

    const openModal = (modal) => {
        setSearchParams(getAccountSearch({ tab: "rank", modal }));
    };

    const closeModal = () => {
        setSearchParams(getAccountSearch({ tab: "rank" }), { replace: true });
    };

    const changeVoucherView = (view) => {
        setSearchParams(getAccountSearch({
            tab: view === "mine" ? "my-vouchers" : "vouchers",
        }));
    };

    let panel = null;
    if (activeTab === "rank") {
        panel = (
            <RankOverviewPanel
                activeModal={activeModal}
                onRequestModal={openModal}
                onCloseModal={closeModal}
            />
        );
    } else if (activeTab === "tickets") {
        panel = <TicketPricingPanel />;
    } else if (activeTab === "vouchers") {
        panel = <VoucherPanel key="voucher-store" view="store" onViewChange={changeVoucherView} />;
    } else if (activeTab === "my-vouchers") {
        panel = <VoucherPanel key="voucher-mine" view="mine" onViewChange={changeVoucherView} />;
    } else if (activeTab === "transactions") {
        panel = <TransactionHistoryPanel />;
    } else if (activeTab === "dat-ban") {
        panel = <DatBanPanel />;
    }

    return (
        <div className="account-center-page">
            <div className="customer-shell">
                <SectionHeading
                    eyebrow={heading.eyebrow}
                    title={heading.title}
                    description={heading.description}
                    as="h1"
                    id="account-center-title"
                />

                <div className="account-center-layout">
                    <AccountNavigation activeKey={activeNavigationKey} />

                    <section
                        ref={contentRef}
                        className="account-center-content"
                        aria-labelledby="account-center-title"
                    >
                        <Suspense fallback={<AccountPanelLoading />}>
                            {panel}
                        </Suspense>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default MemberRank;
