import "../../assets/css/benefit.css";
const benefits = [
    {
        title: "Tích điểm theo giao dịch",
        desc: "Điểm được ghi nhận theo quy tắc hiện hành và hiển thị rõ trong lịch sử giao dịch của thành viên."
    },
    {
        title: "Kho voucher thành viên",
        desc: "Xem điều kiện, số điểm cần đổi và trạng thái voucher trước khi xác nhận sử dụng điểm."
    },
    {
        title: "Theo dõi hạng thành viên",
        desc: "Biết hạng hiện tại, mốc tiếp theo và số điểm còn thiếu trên hành trình thăng hạng."
    },
   
    {
        title: "Ưu đãi theo hạng thành viên",
        desc: "Quyền lợi và voucher được hiển thị theo cấu hình hạng đang áp dụng trong hệ thống."
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
                            key={item.title}
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
