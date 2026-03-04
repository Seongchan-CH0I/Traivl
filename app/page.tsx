"use client";

import { useState } from 'react';
import { Flame, ChevronLeft } from 'lucide-react';

export default function HomePage() {
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [surveyStep, setSurveyStep] = useState(1);
    const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);

    const handleStartSurvey = () => {
        setIsSurveyOpen(true);
        setSurveyStep(1);
    };

    const handleNextStep = () => {
        if (surveyStep < 4) {
            setSurveyStep(prev => prev + 1);
        } else {
            // Complete survey
            setIsSurveyOpen(false);
            setHasCompletedSurvey(true);
        }
    };

    const handlePrevStep = () => {
        if (surveyStep > 1) {
            setSurveyStep(prev => prev - 1);
        } else {
            setIsSurveyOpen(false);
        }
    };

    const renderSurveyModal = () => {
        if (!isSurveyOpen) return null;

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
    };

    if (hasCompletedSurvey) {
        return (
            <main className="home-page pb-safe relative">
                <header className="header">
                    <h1 className="header-title">어디로 떠나볼까요?</h1>
                </header>

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

                <section className="horizontal-section">
                    <div className="section-header-row">
                        <h2 className="section-title mb-0">교토 실시간 인기 장소 Top10</h2>
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

                <section className="list-section">
                    <h2 className="section-title">놓치면 후회할 교토 맛집 🍲</h2>
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

                <button className="floating-action-btn">
                    ✈️ 여행가기
                </button>
            </main>
        );
    }

    return (
        <main className="home-page relative">
            {renderSurveyModal()}
            <header className="header">
                <h1 className="header-title">어디로 떠나볼까요?</h1>
            </header>

            <section className="banner">
                <div className="banner-content">
                    <h2>나의 여행 DNA는 무엇일까? <span className="emoji">🧬</span></h2>
                    <p>30초 설문으로 주상님께 딱 맞는<br />맞춤형 여행 코스를 추천해 드릴게요!</p>
                    <button className="banner-btn" onClick={handleStartSurvey}>지금 분석 후 여행가기 {'>'}</button>
                </div>
            </section>

            <section className="horizontal-section">
                <h2 className="section-title">실시간 인기 도시</h2>
                <div className="scroll-container">
                    <div className="scroll-item circular">
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
