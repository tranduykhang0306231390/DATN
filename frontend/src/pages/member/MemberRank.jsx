import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
    getMemberProfile,
    getMemberPoints
} from "../../api/authApi";

import MemberCard from "../../components/member/MemberCard";
import MemberProgress from "../../components/member/MemberProgress";
import MemberPointSummary from "../../components/member/MemberPointSummary";
import MemberProfile from "../../components/member/MemberProfile";
import PointHistory from "../../components/member/PointHistory";
import RankHistoryModal from "../../components/member/RankHistoryModal";

import "../../assets/css/memberRank.css";

function MemberRank() {

    const [user, setUser] = useState(null);
    const [points, setPoints] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRankHistory, setShowRankHistory] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileRes, pointRes] = await Promise.all([
                getMemberProfile(),
                getMemberPoints()
            ]);

            setUser(profileRes.data.user);
            setPoints(pointRes.data);

        } catch (error) {
            console.log(error);

            Swal.fire({
                icon: "error",
                title: "Không thể tải dữ liệu"
            });

        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <h5>Đang tải dữ liệu...</h5>
            </div>
        );
    }

    return (
        <div className="member-rank-page container">

            {/* TITLE */}
            <div className="page-title">
                <h2>Hạng Thành Viên</h2>
                <p>Quản lý hạng, điểm thưởng và thông tin cá nhân</p>
            </div>

            {/* ===== TOP SECTION (CARD + PROFILE RIGHT) ===== */}
            <div className="member-top-layout">

                {/* LEFT SIDE */}
                <div style={{ flex: 1 }}>

                    <MemberCard
                        user={user}
                        points={points}
                        onShowHistory={() => setShowRankHistory(true)}
                    />

                    <MemberProgress points={points} />

                </div>

                {/* RIGHT SIDE */}
                <div style={{ width: "320px" }}>
                    <MemberProfile user={user} />
                </div>

            </div>

            {/* SUMMARY */}
            <MemberPointSummary points={points} />

            {/* HISTORY */}
            <PointHistory />

            {/* MODAL LỊCH SỬ HẠNG */}
            <RankHistoryModal
                show={showRankHistory}
                onClose={() => setShowRankHistory(false)}
            />

        </div>
    );
}

export default MemberRank;
