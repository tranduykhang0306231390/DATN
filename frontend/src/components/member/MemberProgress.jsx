import "../../assets/css/memberRank.css";

function MemberProgress({ points }) {

    if (!points) return null;

    const rankConfig = {

        HTV001: {
            name: "Đồng",
            min: 0,
            max: 1000,
            next: "Bạc"
        },

        HTV002: {
            name: "Bạc",
            min: 1000,
            max: 3000,
            next: "Vàng"
        },

        HTV003: {
            name: "Vàng",
            min: 3000,
            max: 5000,
            next: "Kim Cương"
        },

        HTV004: {
            name: "Kim Cương",
            min: 5000,
            max: 5000,
            next: null
        }

    };

    const current = rankConfig[points.HangThanhVien];

    if (!current) return null;

    const currentPoint = points.TongDiem;

    let percent = 100;

    let remain = 0;

    if (current.max > current.min) {

        percent = ((currentPoint - current.min) / (current.max - current.min)) * 100;

        percent = Math.max(0, Math.min(percent, 100));

        remain = current.max - currentPoint;

    }

    return (

        <div className="member-progress">

            <div className="progress-header">

                <div>

                    <h4>

                        Tiến trình thăng hạng

                    </h4>

                    <p>

                        Hạng hiện tại: <strong>{current.name}</strong>

                    </p>

                </div>

                <div className="progress-point">

                    {currentPoint.toLocaleString()} điểm

                </div>

            </div>

            <div className="progress-bar-wrapper">

                <div
                    className="progress-bar-fill"
                    style={{

                        width: `${percent}%`

                    }}
                >

                </div>

            </div>

            <div className="progress-boundaries" aria-hidden="true">
                <span>
                    <strong>{current.name}</strong>
                    {current.min.toLocaleString()} điểm
                </span>
                <span className="progress-boundary-end">
                    <strong>{current.next || current.name}</strong>
                    {current.max.toLocaleString()} điểm
                </span>
            </div>

            {

                current.next ?

                    <p className="progress-text">

                        Còn <strong>{remain.toLocaleString()}</strong> điểm để đạt hạng <strong>{current.next}</strong>

                    </p>

                :

                    <p className="progress-text">

                        Bạn đã đạt hạng thành viên cao nhất.

                    </p>

            }

        </div>

    );

}

export default MemberProgress;
