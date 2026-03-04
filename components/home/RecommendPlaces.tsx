export default function RecommendPlaces({ city }: { city: string }) {
    return (
        <section className="horizontal-section">
            <div className="section-header-row">
                <h2 className="section-title mb-0">{city} 실시간 인기 장소 Top10</h2>
                <div className="filter-chips">
                    <button className="chip active">관광지</button>
                    <button className="chip">맛집</button>
                </div>
            </div>
            <div className="scroll-container mt-3">
                <div className="scroll-item rectangular">
                    <img src="https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=300&h=200&fit=crop" alt="후시미 이나리 신사" />
                    <div className="info">
                        <h3>후시미 이나리 신사</h3>
                    </div>
                </div>
                <div className="scroll-item rectangular">
                    <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&h=200&fit=crop" alt="기요미즈데라" />
                    <div className="info">
                        <h3>기요미즈데라</h3>
                    </div>
                </div>
            </div>
        </section>
    );
}
