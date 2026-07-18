import { useCallback, useEffect, useRef, useState } from "react";
import {
    FaExclamationTriangle,
    FaSyncAlt,
} from "react-icons/fa";
import {
    exchangeVoucher,
    getMemberPoints,
    getMyVoucher,
    getVoucherStore,
} from "../../api/authApi";
import MyVoucherList from "../../components/member/MyVoucherList";
import SuccessRewardModal from "../../components/member/SuccessRewardModal";
import VoucherRedeemModal from "../../components/member/VoucherRedeemModal";
import VoucherStoreList from "../../components/member/VoucherStoreList";
import VoucherSummary from "../../components/member/VoucherSummary";
import VoucherTabs from "../../components/member/VoucherTabs";
import {
    getStoreVoucherStatus,
    getVoucherOffer,
    getVoucherRequestError,
    normalizeVoucherPage,
} from "../../utils/voucher";
import { syncStoredCustomerPoints } from "../../utils/customerSession";
import "../../assets/css/customer/voucher.css";

const EMPTY_PAGE = {
    items: [],
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    perPage: 0,
};

function Voucher({ view = "store", onViewChange }) {
    const activeTab = view === "mine" ? "mine" : "store";
    const [points, setPoints] = useState(null);
    const [pointsLoading, setPointsLoading] = useState(true);
    const [pointsError, setPointsError] = useState(null);
    const [pointsReloadKey, setPointsReloadKey] = useState(0);

    const [storePage, setStorePage] = useState(1);
    const [storeData, setStoreData] = useState(EMPTY_PAGE);
    const [storeLoading, setStoreLoading] = useState(true);
    const [storeError, setStoreError] = useState(null);
    const [storeReloadKey, setStoreReloadKey] = useState(0);

    const [myPage, setMyPage] = useState(1);
    const [myData, setMyData] = useState(EMPTY_PAGE);
    const [myLoading, setMyLoading] = useState(true);
    const [myError, setMyError] = useState(null);
    const [myReloadKey, setMyReloadKey] = useState(0);

    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [redeemError, setRedeemError] = useState(null);
    const [successReward, setSuccessReward] = useState(null);
    const submittingRef = useRef(false);
    const catalogueRef = useRef(null);
    const verifiedPoints = pointsError ? null : points;

    useEffect(() => {
        if (activeTab !== "store") return undefined;
        let active = true;

        getMemberPoints()
            .then((response) => {
                if (!active) return;
                setPoints(response.data || null);
                setPointsError(null);
                syncStoredCustomerPoints(response.data);
            })
            .catch((error) => {
                if (active) setPointsError(error);
            })
            .finally(() => {
                if (active) setPointsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [activeTab, pointsReloadKey]);

    useEffect(() => {
        if (activeTab !== "store") return undefined;
        let active = true;
        let pageAdjusted = false;

        getVoucherStore(storePage)
            .then((response) => {
                if (!active) return;
                const nextPage = normalizeVoucherPage(response.data);

                if (
                    nextPage.totalPages > 0 &&
                    storePage > nextPage.totalPages
                ) {
                    pageAdjusted = true;
                    setStorePage(nextPage.totalPages);
                    return;
                }

                if (nextPage.totalPages === 0 && storePage !== 1) {
                    pageAdjusted = true;
                    setStorePage(1);
                    return;
                }

                setStoreData(nextPage);
                setStoreError(null);
            })
            .catch((error) => {
                if (active) setStoreError(error);
            })
            .finally(() => {
                if (active && !pageAdjusted) setStoreLoading(false);
            });

        return () => {
            active = false;
        };
    }, [activeTab, storePage, storeReloadKey]);

    useEffect(() => {
        if (activeTab !== "mine") return undefined;
        let active = true;
        let pageAdjusted = false;

        getMyVoucher(myPage)
            .then((response) => {
                if (!active) return;
                const nextPage = normalizeVoucherPage(response.data);

                if (nextPage.totalPages > 0 && myPage > nextPage.totalPages) {
                    pageAdjusted = true;
                    setMyPage(nextPage.totalPages);
                    return;
                }

                if (nextPage.totalPages === 0 && myPage !== 1) {
                    pageAdjusted = true;
                    setMyPage(1);
                    return;
                }

                setMyData(nextPage);
                setMyError(null);
            })
            .catch((error) => {
                if (active) setMyError(error);
            })
            .finally(() => {
                if (active && !pageAdjusted) setMyLoading(false);
            });

        return () => {
            active = false;
        };
    }, [activeTab, myPage, myReloadKey]);

    const scrollToCatalogue = useCallback(() => {
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        catalogueRef.current?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start",
        });
    }, []);

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        onViewChange?.(tab);
        scrollToCatalogue();
    };

    const handleStorePageChange = (page) => {
        const safePage = Math.max(1, Math.min(page, storeData.totalPages || 1));
        if (safePage === storePage) return;
        setStoreLoading(true);
        setStoreError(null);
        setStoreData((current) => ({ ...current, items: [] }));
        setStorePage(safePage);
        scrollToCatalogue();
    };

    const handleMyPageChange = (page) => {
        const safePage = Math.max(1, Math.min(page, myData.totalPages || 1));
        if (safePage === myPage) return;
        setMyLoading(true);
        setMyError(null);
        setMyData((current) => ({ ...current, items: [] }));
        setMyPage(safePage);
        scrollToCatalogue();
    };

    const retryPoints = () => {
        setPointsLoading(true);
        setPointsError(null);
        setPointsReloadKey((current) => current + 1);
    };

    const retryStore = () => {
        setStoreLoading(true);
        setStoreError(null);
        setStoreReloadKey((current) => current + 1);
    };

    const retryMine = () => {
        setMyLoading(true);
        setMyError(null);
        setMyReloadKey((current) => current + 1);
    };

    const handleOpenRedeem = (voucher) => {
        const offer = getVoucherOffer(voucher);
        const status = getStoreVoucherStatus({
            voucher: offer,
            currentPoints: verifiedPoints?.TongDiem,
            memberRankCode: verifiedPoints?.HangThanhVien,
        });

        if (!status.canRedeem || submittingRef.current) return;
        setRedeemError(null);
        setSelectedVoucher(offer);
    };

    const handleCloseRedeem = useCallback(() => {
        if (submittingRef.current) return;
        setSelectedVoucher(null);
        setRedeemError(null);
    }, []);

    const refreshVoucherLists = useCallback(() => {
        setStoreLoading(true);
        setStoreReloadKey((current) => current + 1);

        setMyLoading(true);
        if (myPage !== 1) {
            setMyData((current) => ({ ...current, items: [] }));
            setMyPage(1);
        } else {
            setMyReloadKey((current) => current + 1);
        }
    }, [myPage]);

    const refreshAfterRedeemFailure = useCallback(() => {
        setPointsLoading(true);
        setPointsReloadKey((current) => current + 1);
        refreshVoucherLists();
    }, [refreshVoucherLists]);

    const handleConfirmRedeem = async () => {
        if (submittingRef.current || !selectedVoucher) return;

        const status = getStoreVoucherStatus({
            voucher: selectedVoucher,
            currentPoints: verifiedPoints?.TongDiem,
            memberRankCode: verifiedPoints?.HangThanhVien,
        });
        if (!status.canRedeem) {
            setRedeemError(status.reason);
            return;
        }

        submittingRef.current = true;
        setSubmitting(true);
        setRedeemError(null);

        const redeemedVoucher = selectedVoucher;

        try {
            const exchangeResponse = await exchangeVoucher(redeemedVoucher.MaUuDai);
            let latestPoints = exchangeResponse.data?.TongDiem;

            if (!Number.isFinite(Number(latestPoints))) {
                try {
                    const pointResponse = await getMemberPoints();
                    setPoints(pointResponse.data || null);
                    setPointsError(null);
                    syncStoredCustomerPoints(pointResponse.data);
                    latestPoints = pointResponse.data?.TongDiem;
                } catch (pointError) {
                    setPointsError(pointError);
                    latestPoints = null;
                }
            } else {
                const nextPoints = {
                    ...points,
                    TongDiem: Math.max(0, Number(latestPoints)),
                };
                setPoints(nextPoints);
                setPointsError(null);
                syncStoredCustomerPoints(nextPoints);
            }

            refreshVoucherLists();
            setSelectedVoucher(null);
            setSuccessReward({
                voucher: redeemedVoucher,
                pointsUsed: redeemedVoucher.SoDiemCanDoi,
                remainingPoints: Number.isFinite(Number(latestPoints))
                    ? Math.max(0, Number(latestPoints))
                    : null,
            });
        } catch (error) {
            setRedeemError(getVoucherRequestError(error));
            refreshAfterRedeemFailure();
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const handleViewMine = () => {
        setSuccessReward(null);
        handleTabChange("mine");
    };

    const handleCloseSuccess = useCallback(() => {
        setSuccessReward(null);
    }, []);

    return (
        <div className="reward-voucher-page reward-voucher-page--embedded">
            <div className="reward-voucher-content">
                {activeTab === "store" && pointsError && (
                    <div className="reward-voucher-points-error" role="status">
                        <FaExclamationTriangle aria-hidden="true" />
                        <span>Chưa tải được điểm hiện có. Chức năng đổi tạm thời bị khóa.</span>
                        <button type="button" onClick={retryPoints}>
                            <FaSyncAlt aria-hidden="true" /> Thử lại
                        </button>
                    </div>
                )}

                {activeTab === "store" && (
                    <VoucherSummary
                        points={verifiedPoints}
                        pointsLoading={pointsLoading}
                        storeCount={storeData.totalItems}
                        ownedCount={null}
                    />
                )}

                <div ref={catalogueRef} className="reward-voucher-catalogue">
                    <VoucherTabs
                        activeTab={activeTab}
                        storeCount={!storeLoading && !storeError ? storeData.totalItems : null}
                        ownedCount={!myLoading && !myError ? myData.totalItems : null}
                        onTabChange={handleTabChange}
                    />
                    {activeTab === "store" ? (
                        <VoucherStoreList
                            vouchers={storeData.items}
                            points={verifiedPoints}
                            page={storePage}
                            totalPages={storeData.totalPages}
                            loading={storeLoading}
                            error={storeError}
                            submittingVoucherId={submitting ? selectedVoucher?.MaUuDai : null}
                            onRedeem={handleOpenRedeem}
                            onPageChange={handleStorePageChange}
                            onRetry={retryStore}
                        />
                    ) : (
                        <MyVoucherList
                            vouchers={myData.items}
                            page={myPage}
                            totalPages={myData.totalPages}
                            loading={myLoading}
                            error={myError}
                            onPageChange={handleMyPageChange}
                            onRetry={retryMine}
                        />
                    )}
                </div>
            </div>

            <VoucherRedeemModal
                voucher={selectedVoucher}
                currentPoints={verifiedPoints?.TongDiem}
                open={Boolean(selectedVoucher)}
                submitting={submitting}
                error={redeemError}
                onClose={handleCloseRedeem}
                onConfirm={handleConfirmRedeem}
            />

            <SuccessRewardModal
                open={Boolean(successReward)}
                voucher={successReward?.voucher}
                pointsUsed={successReward?.pointsUsed}
                remainingPoints={successReward?.remainingPoints}
                onClose={handleCloseSuccess}
                onViewMine={handleViewMine}
            />
        </div>
    );
}

export default Voucher;
