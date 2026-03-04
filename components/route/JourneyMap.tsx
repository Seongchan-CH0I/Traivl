import { ChevronLeft, Menu, MapPin } from 'lucide-react';

interface JourneyMapProps {
    onBack: () => void;
}

export default function JourneyMap({ onBack }: JourneyMapProps) {
    return (
        <div className="journey-container">
            <div className="jm-top-bar">
                <button className="jm-circle-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <button className="jm-circle-btn">
                    <Menu size={20} />
                </button>
            </div>

            <div className="jm-map-area">
                <svg className="jm-path-svg">
                    <path d="M 100 80 L 300 160" stroke="#8cb8f9" strokeWidth="2.5" strokeDasharray="6 6" fill="none" />
                </svg>

                <div className="jm-marker-current">현재</div>
                <div className="jm-marker-dot-current"></div>

                <div className="jm-marker-dest">여행지</div>
                <div className="jm-marker-dot-dest"></div>

                <div className="jm-float-msg">
                    <MapPin size={16} color="#ff4757" fill="#ff4757" /> 목적지까지 도보 10분
                </div>
            </div>

            <div className="jm-bottom-sheet">
                <div className="jm-sheet-subtitle">지금 가야할 장소</div>
                <div className="jm-sheet-title">간사이 공항</div>

                <div className="jm-btn-row">
                    <button className="jm-btn-main">가자</button>
                    <button className="jm-btn-sub">다른 길</button>
                </div>
            </div>
        </div>
    );
}
