import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export default function SurveyModal({ isOpen, onClose, onComplete }: SurveyModalProps) {
    const [surveyStep, setSurveyStep] = useState(1);

    if (!isOpen) return null;

    const handleNextStep = () => {
        if (surveyStep < 4) {
            setSurveyStep(prev => prev + 1);
        } else {
            onComplete();
            setSurveyStep(1); // Reset for future visits
        }
    };

    const handlePrevStep = () => {
        if (surveyStep > 1) {
            setSurveyStep(prev => prev - 1);
        } else {
            onClose();
            setSurveyStep(1);
        }
    };

    const questions = [
        {
            title: "여행에서 가장 중요한 가치는?",
            subtitle: "당신의 여행 스타일을 알려주세요",
            options: [
                { icon: "🏛️", name: "지식·문화", desc: "박물관, 갤러리, 역사 탐방" },
                { icon: "🌴", name: "휴식", desc: "느긋한 힐링과 여유" },
                { icon: "🍜", name: "맛집", desc: "현지 음식과 미식 탐험" },
                { icon: "🧗", name: "활동", desc: "액티비티와 모험" }
            ]
        },
        {
            title: "여행 속도는 어떻게?",
            subtitle: "하루 일정의 밀도를 선택하세요",
            options: [
                { icon: "⚡", name: "풀코스", desc: "빠르게 많은 곳 방문" },
                { icon: "🐌", name: "여유", desc: "천천히 깊게 탐방" },
                { icon: "🎲", name: "즉흥", desc: "그때그때 결정" },
                { icon: "🎯", name: "테마 몰입", desc: "한 가지에 집중" }
            ]
        },
        {
            title: "예산 스타일은?",
            subtitle: "여행 비용 배분 방식",
            options: [
                { icon: "💰", name: "가성비", desc: "합리적 소비" },
                { icon: "💎", name: "럭셔리", desc: "프리미엄 경험" },
                { icon: "🎯", name: "전략 투자", desc: "핵심에만 투자" },
                { icon: "🛍️", name: "쇼핑", desc: "쇼핑 중심" }
            ]
        },
        {
            title: "장소 선택 기준은?",
            subtitle: "어떤 곳을 선호하시나요?",
            options: [
                { icon: "🏘️", name: "로컬", desc: "현지인이 가는 곳" },
                { icon: "📸", name: "SNS 핫플", desc: "인스타 감성" },
                { icon: "🏯", name: "역사 명소", desc: "유명 관광지" },
                { icon: "👥", name: "커뮤니티", desc: "추천 맛집/명소" }
            ]
        }
    ];

    const currentQ = questions[surveyStep - 1];

    return (
        <div className="survey-modal">
            <div className="survey-header">
                <button className="back-btn" onClick={handlePrevStep}>
                    <ChevronLeft />
                </button>
                <span className="survey-title">여행 DNA 분석</span>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="progress-container">
                <div className="progress-text-row">
                    <div className="progress-text">{surveyStep}/4</div>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(surveyStep / 4) * 100}%` }}></div>
                </div>
            </div>

            <div className="survey-content">
                <h2 className="question-title">{currentQ.title}</h2>
                <p className="question-subtitle">{currentQ.subtitle}</p>

                <div className="options-list">
                    {currentQ.options.map((opt, idx) => (
                        <button key={idx} className="option-btn" onClick={handleNextStep}>
                            <span className="option-icon">{opt.icon}</span>
                            <div className="option-text">
                                <div className="option-name">{opt.name}</div>
                                <div className="option-desc">{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
