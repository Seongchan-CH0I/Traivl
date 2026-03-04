import { Flame } from 'lucide-react';

export default function HotPlaces() {
    return (
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
    );
}
