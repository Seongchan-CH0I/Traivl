import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (resultData?: any) => void;
}

export default function SurveyModal({ isOpen, onClose, onComplete }: SurveyModalProps) {
    const [surveyStep, setSurveyStep] = useState(1);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleOptionSelect = async (optionId: string) => {
        const newAnswers = [...answers, optionId];
        setAnswers(newAnswers);

        if (surveyStep < 4) {
            setSurveyStep(prev => prev + 1);
        } else {
            setIsLoading(true);
            try {
                const res = await fetch('/api/survey', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: newAnswers }),
                });
                const responseData = await res.json();

                if (responseData.success) {
                    onComplete(responseData.data);
                }

                setSurveyStep(1);
                setAnswers([]);
            } catch (error) {
                console.error("Failed to submit survey:", error);
                alert("결과 분석 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handlePrevStep = () => {
        if (surveyStep > 1) {
            setSurveyStep(prev => prev - 1);
            setAnswers(prev => prev.slice(0, -1)); // 이전 단계로 갈 때 마지막 답변 제외
        } else {
            onClose();
            setSurveyStep(1);
            setAnswers([]);
        }
    };

    const questions = [
        {
            title: "여행에서 가장 중요한 가치는?",
            subtitle: "당신의 여행 스타일을 알려주세요",
            options: [
                { id: "Q1_CULTURE", icon: "🏛️", name: "지식·문화", desc: "박물관, 갤러리, 역사 탐방" },
                { id: "Q1_RELAX", icon: "🌴", name: "휴식", desc: "느긋한 힐링과 여유" },
                { id: "Q1_FOOD", icon: "🍜", name: "맛집", desc: "현지 음식과 미식 탐험" },
                { id: "Q1_ACTIVE", icon: "🧗", name: "활동", desc: "액티비티와 모험" }
            ]
        },
        {
            title: "여행 속도는 어떻게?",
            subtitle: "하루 일정의 밀도를 선택하세요",
            options: [
                { id: "Q2_FULL_COURSE", icon: "⚡", name: "풀코스", desc: "빠르게 많은 곳 방문" },
                { id: "Q2_RELAXED", icon: "🐌", name: "여유", desc: "천천히 깊게 탐방" },
                { id: "Q2_IMPROMPTU", icon: "🎲", name: "즉흥", desc: "그때그때 결정" },
                { id: "Q2_THEME", icon: "🎯", name: "테마 몰입", desc: "한 가지에 집중" }
            ]
        },
        {
            title: "예산 스타일은?",
            subtitle: "여행 비용 배분 방식",
            options: [
                { id: "Q3_COST_EFFECTIVE", icon: "💰", name: "가성비", desc: "합리적 소비" },
                { id: "Q3_LUXURY", icon: "💎", name: "럭셔리", desc: "프리미엄 경험" },
                { id: "Q3_STRATEGIC", icon: "🎯", name: "전략 투자", desc: "핵심에만 투자" },
                { id: "Q3_SHOPPING", icon: "🛍️", name: "쇼핑", desc: "쇼핑 중심" }
            ]
        },
        {
            title: "장소 선택 기준은?",
            subtitle: "어떤 곳을 선호하시나요?",
            options: [
                { id: "Q4_LOCAL", icon: "🏘️", name: "로컬", desc: "현지인이 가는 곳" },
                { id: "Q4_SNS", icon: "📸", name: "SNS 핫플", desc: "인스타 감성" },
                { id: "Q4_HISTORY", icon: "🏯", name: "역사 명소", desc: "유명 관광지" },
                { id: "Q4_COMMUNITY", icon: "👥", name: "커뮤니티", desc: "추천 맛집/명소" }
            ]
        }
    ];

    const currentQ = questions[surveyStep - 1];

    return (
        <div className="survey-modal">
            <div className="survey-header">
                <button className="back-btn" onClick={handlePrevStep} disabled={isLoading}>
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
                <h2 className="question-title">{isLoading ? "결과 분석 중..." : currentQ.title}</h2>
                <p className="question-subtitle">{isLoading ? "당신에게 딱 맞는 여행지를 찾고 있어요 ✈️" : currentQ.subtitle}</p>

                {!isLoading && (
                    <div className="options-list">
                        {currentQ.options.map((opt) => (
                            <button key={opt.id} className="option-btn" onClick={() => handleOptionSelect(opt.id)}>
                                <span className="option-icon">{opt.icon}</span>
                                <div className="option-text">
                                    <div className="option-name">{opt.name}</div>
                                    <div className="option-desc">{opt.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
