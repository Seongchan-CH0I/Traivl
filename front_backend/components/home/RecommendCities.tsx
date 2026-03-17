export default function RecommendCities() {
    return (
        <section className="horizontal-section">
            <h2 className="section-title">내 취향에 맞는 추천 도시</h2>
            <div className="scroll-container pt-2">
                <div className="scroll-item circular active-city">
                    <div className="circular-img-wrapper">
                        <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=200&h=200&fit=crop" alt="교토" />
                    </div>
                    <span>교토</span>
                </div>
                <div className="scroll-item circular">
                    <div className="circular-img-wrapper">
                        <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200&h=200&fit=crop" alt="파리" />
                    </div>
                    <span>파리</span>
                </div>
                <div className="scroll-item circular">
                    <div className="circular-img-wrapper">
                        <img src="https://images.unsplash.com/photo-1583422409516-2895a77efded?w=200&h=200&fit=crop" alt="바르셀로나" />
                    </div>
                    <span>바르셀로나</span>
                </div>
                <div className="scroll-item circular">
                    <div className="circular-img-wrapper">
                        <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&h=200&fit=crop" alt="도쿄" />
                    </div>
                    <span>도쿄</span>
                </div>
            </div>
        </section>
    );
}
