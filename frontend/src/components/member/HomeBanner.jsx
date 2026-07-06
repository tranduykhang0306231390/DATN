import { useEffect, useState } from "react";
import { getBanners } from "../../api/bannerApi";

function HomeBanner() {
    const [banners, setBanners] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const res = await getBanners();
            setBanners(res.data);
        };

        fetchData();
    }, []);

    if (!banners.length) {
        return <div>Đang tải banner...</div>;
    }

    return (
        <div
            id="memberBanner"
            className="carousel slide banner-wrapper"
            data-bs-ride="carousel"
            data-bs-interval="4000"
        >
            <div className="carousel-inner">

                {banners.map((item, index) => (
                    <div
                        key={item.MaBanner}
                        className={`carousel-item ${index === 0 ? "active" : ""}`}
                    >
                        <div
                            className="banner-slide"
                            style={{
                                backgroundImage: `url(${item.Link})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                height: "420px"
                            }}
                        >
                        </div>
                    </div>
                ))}

            </div>

            {/* control */}
            <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#memberBanner"
                data-bs-slide="prev"
            >
                <span className="carousel-control-prev-icon" />
            </button>

            <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#memberBanner"
                data-bs-slide="next"
            >
                <span className="carousel-control-next-icon" />
            </button>
        </div>
    );
}

export default HomeBanner;