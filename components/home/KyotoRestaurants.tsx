export default function KyotoRestaurants() {
    return (
        <section className="list-section">
            {/* 이 부분을 section-header-row로 감싸서 가로 배치를 활성화합니다 */}
            <div className="section-header-row">
                <h2 className="section-title mb-0">놓치면 후회할 교토 맛집 🍲</h2>
                <div className="filter-chips">
                    <button className="chip active">맛집</button>    
                </div>
            </div>

            <div className="list-container">
                <div className="list-item">
                    <img src="https://images.unsplash.com/photo-1617196034738-26c5f7c37778?w=150&h=150&fit=crop" alt="카츠쿠라" />
                    <div className="item-info">
                        <h3>교토 카츠쿠라</h3>
                        <p>바삭한 정통 돈카츠와 특제 소스</p>
                    </div>
                </div>
                <div className="list-item">
                    <img src="https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=150&h=150&fit=crop" alt="오와리야" />
                    <div className="item-info">
                        <h3>혼케 오와리야</h3>
                        <p>500년 전통 소바 전문점</p>
                    </div>
                </div>
            </div>
        </section>
    );
}