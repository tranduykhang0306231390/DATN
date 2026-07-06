import "../../assets/css/benefit.css";
const benefits = [
    {
        title: "Nhân đôi hệ số tích điểm",
        desc: "Mỗi hóa đơn được nhân đôi điểm thưởng. Càng trải nghiệm nhiều, bạn càng nhanh đổi voucher và quà tặng giá trị."
    },
    {
        title: "Kho voucher hàng ngàn ưu đãi",
        desc: "Voucher giảm giá, tặng món và các ưu đãi độc quyền luôn được cập nhật để thành viên tiết kiệm hơn."
    },
    {
        title: "Ưu đãi sinh nhật đặc biệt",
        desc: "Nhận voucher sinh nhật cùng những phần quà riêng giúp bữa buffet của bạn trở nên đáng nhớ hơn."
    },
   
    {
        title: "Ưu đãi theo hạng thành viên",
        desc: "Cấp bậc càng cao, quyền lợi càng lớn với nhiều ưu đãi độc quyền chỉ dành riêng cho bạn."
    }
];

function Benefit() {

    return (

        <section className="benefit-section" id="quyenloi">

            <div className="container">

                <div className="benefit-header">

                    <span className="ticket-eyebrow">
                        THÀNH VIÊN BUFFET VIP
                    </span>

                    <h2>
                        Quyền lợi nổi bật
                    </h2>

                    <p>
                        Trở thành thành viên để nhận hàng loạt ưu đãi và tận hưởng trải nghiệm buffet cao cấp hơn.
                    </p>

                </div>

                <div className="benefit-grid">

                    {benefits.map((item, index) => (

                        <div
                            className="benefit-card"
                            key={index}
                        >

                            <div className="benefit-top">

                                <div className="benefit-number">

                                    {(index + 1).toString().padStart(2, "0")}

                                </div>

                                <div className="benefit-line"></div>

                            </div>

                            <h3>

                                {item.title}

                            </h3>

                            <p>

                                {item.desc}

                            </p>


                        </div>

                    ))}

                </div>


            </div>

        </section>

    );

}

export default Benefit;