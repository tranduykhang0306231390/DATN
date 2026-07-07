import { useEffect, useState } from "react";
import { getBanners } from "../../api/bannerApi";

function HomeBanner() {

    const [banners, setBanners] = useState([]);

    useEffect(() => {

        const fetchData = async () => {

            try {

                const res = await getBanners();
                setBanners(res.data || []);

            } catch (err) {

                console.log(err);

            }

        };

        fetchData();

    }, []);

    if (!banners.length) {

        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "420px" }}
            >
                Đang tải banner...
            </div>
        );

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

                        <img
                            src={item.Link}
                            alt={`Banner ${index + 1}`}
                            style={{
                                width: "100%",
                                height: "510px",
                                objectFit: "contain",
                                objectPosition: "center",
                                display: "block",
                                backgroundColor: "#ffffff"
                            }}
                        />

                    </div>

                ))}

            </div>

            <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#memberBanner"
                data-bs-slide="prev"
            >
                <span className="carousel-control-prev-icon"></span>
            </button>

            <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#memberBanner"
                data-bs-slide="next"
            >
                <span className="carousel-control-next-icon"></span>
            </button>

        </div>

    );

}

export default HomeBanner;