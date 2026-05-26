import { ChevronLeft, Menu, MapPin, Star } from 'lucide-react';
import { useAi } from '../../context/AiContext';
import { useEffect } from 'react';

export default function JourneyMap({ onBack }: { onBack: () => void }) {
    const { toggleAiMenu, isAiMenuOpen, setIsJourneyMapMode, itineraryData } = useAi();

    useEffect(() => {
        setIsJourneyMapMode(true);
        return () => setIsJourneyMapMode(false);
    }, [setIsJourneyMapMode]);

    // 전역 상태에 저장된 AI 일정에서 Day 1의 첫 장소 추출 (폴백 처리 적용)
    const firstPlace = itineraryData?.itinerary?.[0]?.places?.[0];
    const destinationTitle = firstPlace?.title || "간사이 공항";
    const recommendedReason = firstPlace?.location || "여행의 설레는 첫 출발지입니다.";

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

                <div className="jm-marker-dest">{destinationTitle.slice(0, 7)}</div>
                <div className="jm-marker-dot-dest"></div>

                <div className="jm-float-msg">
                    <MapPin size={16} color="#ff4757" fill="#ff4757" /> 목적지까지 도보 12분
                </div>
            </div>

            <div className="jm-bottom-sheet" style={{ padding: '20px', minHeight: '190px' }}>
                <div className="jm-sheet-subtitle" style={{ fontSize: '13px', color: '#8c52ff', fontWeight: 700 }}>지금 가야할 장소</div>
                <div className="jm-sheet-title" style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 8px 0' }}>{destinationTitle}</div>
                <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.4', margin: '0 0 16px 0', wordBreak: 'keep-all' }}>
                    {recommendedReason}
                </p>

                <div className="jm-btn-row">
                    <button className="jm-btn-main">가자</button>
                    <div style={{ width: '70px', flexShrink: 0 }}></div> {/* Space for AI button */}
                    <button className="jm-btn-sub" onClick={onBack}>다른 길</button>
                </div>
            </div>

            {/* Centered AI Button at the very bottom */}
            <div className="jm-ai-center-btn">
                <button 
                    className={`jm-ai-star-btn ${isAiMenuOpen ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleAiMenu();
                    }}
                >
                    <Star size={24} color="white" fill="white" />
                </button>
            </div>
        </div>
    );
}
