export default function Banner({ onStart }: { onStart: () => void }) {
    return (
        <section className="banner">
            <div className="banner-content">
                <h2>나의 여행 DNA는 무엇일까? <span className="emoji">🧬</span></h2>
                <p>30초 설문으로 주상님께 딱 맞는<br />맞춤형 여행 코스를 추천해 드릴게요!</p>
                <button className="banner-btn" onClick={onStart}>지금 분석 후 여행가기 {'>'}</button>
            </div>
        </section>
    );
}
