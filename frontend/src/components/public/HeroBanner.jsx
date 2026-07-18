// ===== THAY ẢNH BANNER TẠI ĐÂY =====
import banner from "../../assets/images/banner-home-optimized.jpg";

function HeroBanner() {

    return (

        <section className="hero-banner">

            <img
                src={banner}
                alt="Không gian trải nghiệm Buffet"
                width="1600"
                height="640"
                fetchPriority="high"
                decoding="async"
            />

        </section>

    );

}

export default HeroBanner;
