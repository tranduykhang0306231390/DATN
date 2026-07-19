// ===== THAY ẢNH BANNER TẠI ĐÂY =====
import banner from "../../assets/images/banner-home-optimized.jpg";

function HeroBanner() {

    return (

        <section className="hero-banner">

            <img
                src={banner}
                alt="Không gian trải nghiệm Buffet VIP"
                width="1600"
                height="640"
                fetchPriority="high"
                decoding="async"
                className="hero-banner__image"
            />

            <div className="hero-banner__overlay" aria-hidden="true" />

            <div className="hero-banner__content">
                <span className="hero-banner__eyebrow">
                    Buffet VIP Rewards Club
                </span>

                <h1 className="hero-banner__title">
                    Trải nghiệm buffet đẳng cấp, tận hưởng đặc quyền xứng tầm
                </h1>

                <p className="hero-banner__description">
                    Tích điểm sau mỗi bữa ăn, thăng hạng thành viên và đổi
                    những ưu đãi được thiết kế riêng cho khách hàng thân
                    thiết.
                </p>

                <div className="hero-banner__actions">
                    <a
                        href="#dangnhap"
                        className="customer-button customer-button--primary"
                    >
                        Tham gia ngay
                    </a>

                    <a
                        href="#quyenloi"
                        className="customer-button customer-button--secondary"
                    >
                        Khám phá quyền lợi
                    </a>
                </div>
            </div>

        </section>

    );

}

export default HeroBanner;
