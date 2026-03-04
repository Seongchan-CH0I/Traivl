import { Bell, Flame } from 'lucide-react';

export default function HomePage() {
    return (
        <main className="home-page">
            <header className="header">
                <h1 className="header-title">어디로 떠나볼까요?</h1>
                <button className="notification-btn">
                    <Bell className="bell-icon" />
                </button>
            </header>

            <section className="banner">
                <div className="banner-content">
                    <h2>나의 여행 DNA는 무엇일까? <span className="emoji">🧬</span></h2>
                    <p>30초 설문으로 주상님께 딱 맞는<br />맞춤형 여행 코스를 추천해 드릴게요!</p>
                    <button className="banner-btn">지금 분석 후 여행가기 {'>'}</button>
                </div>
            </section>

            <section className="horizontal-section">
                <h2 className="section-title">실시간 인기 도시</h2>
                <div className="scroll-container">
                    <div className="scroll-item circular">
                        <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=200&h=200&fit=crop" alt="교토" />
                        <span>교토</span>
                    </div>
                    <div className="scroll-item circular">
                        <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200&h=200&fit=crop" alt="파리" />
                        <span>파리</span>
                    </div>
                    <div className="scroll-item circular">
                        <img src="https://images.unsplash.com/photo-1583422409516-2895a77efded?w=200&h=200&fit=crop" alt="바르셀로나" />
                        <span>바르셀로나</span>
                    </div>
                    <div className="scroll-item circular">
                        <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&h=200&fit=crop" alt="도쿄" />
                        <span>도쿄</span>
                    </div>
                </div>
            </section>

            <section className="horizontal-section">
                <h2 className="section-title">지금 핫한 여행지 Top 10 <Flame className="flame-icon" /></h2>
                <div className="scroll-container">
                    <div className="scroll-item rectangular">
                        <img src="https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=300&h=200&fit=crop" alt="후시미 이나리 신사" />
                        <div className="info">
                            <h3>후시미 이나리 신사</h3>
                            <p>교토 · 명소</p>
                        </div>
                    </div>
                    <div className="scroll-item rectangular">
                        <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&h=200&fit=crop" alt="기요미즈데라" />
                        <div className="info">
                            <h3>기요미즈데라</h3>
                            <p>교토 · 명소</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
