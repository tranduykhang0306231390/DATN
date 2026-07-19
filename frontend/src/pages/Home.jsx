import Benefit from "../components/public/Benefit";
import HeroBanner from "../components/public/HeroBanner";
import LoginSection from "../components/public/LoginSection";

const REWARDS_STEPS = [
    {
        number: "01",
        title: "Giao dịch và tích điểm",
        description:
            "Điểm được ghi nhận theo quy tắc đang áp dụng của hệ thống.",
    },
    {
        number: "02",
        title: "Theo dõi hành trình hạng",
        description:
            "Biết hạng hiện tại, mốc tiếp theo và số điểm còn thiếu.",
    },
    {
        number: "03",
        title: "Đổi quyền lợi phù hợp",
        description:
            "Dùng điểm để đổi voucher và theo dõi trạng thái ngay trong tài khoản.",
    },
];

function Home() {
    return (
        <div className="customer-public-home">
            <HeroBanner />

            <LoginSection />

            <section
                id="gioithieu"
                className="public-rewards-story"
                aria-labelledby="public-rewards-story-title"
            >
                <div className="container">
                    <header className="public-rewards-story__heading">
                        <span className="ticket-eyebrow">
                            BUFFET VIP REWARDS
                        </span>

                        <h2 id="public-rewards-story-title">
                            Một tài khoản, toàn bộ hành trình thành viên
                        </h2>

                        <p>
                            Mọi thông tin quan trọng đều được tập trung rõ
                            ràng, giúp bạn kiểm tra quyền lợi nhanh mà không
                            cần tìm kiếm ở nhiều nơi.
                        </p>
                    </header>

                    <div className="public-rewards-story__grid">
                        {REWARDS_STEPS.map((step) => (
                            <article
                                className="public-rewards-story__item"
                                key={step.number}
                            >
                                <span>{step.number}</span>

                                <div>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <Benefit />
        </div>
    );
}

export default Home;