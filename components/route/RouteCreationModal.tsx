"use client";

import { useState } from 'react';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

interface RouteCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartJourney: () => void;
}

export default function RouteCreationModal({ isOpen, onClose, onStartJourney }: RouteCreationModalProps) {
    const [step, setStep] = useState(1);

    // States
    const [continent, setContinent] = useState('아시아');
    const [country, setCountry] = useState('JP 일본 (Japan)');
    const [city, setCity] = useState('교토');
    const [themes, setThemes] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => {
        if (step > 1) setStep(prev => prev - 1);
        else onClose();
    };

    const toggleTheme = (t: string) => {
        if (themes.includes(t)) setThemes(themes.filter(x => x !== t));
        else setThemes([...themes, t]);
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="rc-title-area text-center" style={{ paddingTop: '20px' }}>
                            <div style={{ color: '#b0b0b0', fontSize: 13, marginBottom: 8 }}>떠나고 싶은 대륙을 선택하세요</div>
                            <h2 style={{ color: 'var(--primary-color)', fontSize: 20, fontWeight: 700 }}>Choose Your Destination</h2>
                        </div>
                        <div className="rc-grid-2">
                            <div className={`rc-continent asia ${continent === '아시아' ? 'selected' : ''}`} onClick={() => setContinent('아시아')}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🌍</div>
                                아시아
                            </div>
                            <div className={`rc-continent europe ${continent === '유럽' ? 'selected' : ''}`} onClick={() => setContinent('유럽')}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🏰</div>
                                유럽
                            </div>
                        </div>
                        <div className="rc-bottom">
                            <div className="rc-bottom-info">
                                <CheckCircle2 size={16} color="var(--primary-color)" /> 선택된 대륙: <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{continent}</span>
                            </div>
                            <button className="rc-btn-primary" onClick={handleNext}>다음으로</button>
                        </div>
                    </>
                );
            case 2:
                const countries = [
                    { code: 'JP', name: '일본 (Japan)' },
                    { code: 'KR', name: '한국 (Korea)' },
                    { code: 'TH', name: '태국 (Thailand)' },
                    { code: 'SG', name: '싱가포르 (Singapore)' }
                ];
                return (
                    <>
                        <div className="rc-title-area">
                            <h2 className="rc-title">국가를 선택하세요</h2>
                            <p className="rc-subtitle">여행할 국가를 골라주세요</p>
                        </div>
                        <div className="rc-list-y">
                            {countries.map(c => (
                                <div key={c.code} className={`rc-country-item ${country === `${c.code} ${c.name}` ? 'selected' : ''}`} onClick={() => setCountry(`${c.code} ${c.name}`)}>
                                    <span className="rc-country-code">{c.code}</span>
                                    <span className="rc-country-name">{c.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="rc-bottom">
                            <button className="rc-btn-primary" onClick={handleNext}>다음으로</button>
                        </div>
                    </>
                );
            case 3:
                const cities = [
                    { name: '교토', desc: '고즈넉한 전통과 시간의 어울림', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=200&fit=crop' },
                    { name: '도쿄', desc: '화려함과 전통이 공존하는 메트로', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=200&fit=crop' },
                    { name: '오사카', desc: '맛과 활기가 넘치는 도시', img: 'https://images.unsplash.com/photo-1590559899731-a382839cecd5?w=400&h=200&fit=crop' }
                ];
                return (
                    <>
                        <div className="rc-title-area">
                            <h2 className="rc-title">도시를 선택하세요</h2>
                            <p className="rc-subtitle">여행할 도시를 골라주세요</p>
                        </div>
                        <div className="rc-list-y">
                            {cities.map(c => (
                                <div key={c.name} className={`rc-city-card ${city === c.name ? 'selected' : ''}`} onClick={() => setCity(c.name)}>
                                    <img src={c.img} alt={c.name} draggable={false} />
                                    <div className="rc-city-overlay">
                                        <h3>{c.name}</h3>
                                        <p>{c.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="rc-bottom">
                            <button className="rc-btn-primary" onClick={handleNext}>다음으로</button>
                        </div>
                    </>
                );
            case 4:
                const themeOptions = [
                    "🎓 졸업여행", "📸 인스타감성", "🍜 맛집투어",
                    "🏯 문화체험", "🍵 힐링", "🧗 액티비티",
                    "🛍️ 쇼핑", "🌃 야경투어", "🏛️ 역사탐방", "🌳 자연"
                ];
                const percentage = Math.min(Math.max((themes.length / 4) * 100, 5), 100);
                return (
                    <>
                        <div className="rc-title-area">
                            <h2 className="rc-title">{city}에서 무엇을 하고 싶나요?</h2>
                            <p className="rc-subtitle">원하는 테마를 모두 선택해주세요</p>
                        </div>
                        <div className="rc-theme-banner">
                            <div className="header">
                                <span>✨ 테마 및 취향 설정</span>
                            </div>
                            <div className="bar-bg">
                                <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <div className="footer">
                                <span>{themes.length}개 테마 선택됨</span>
                                <span>취향 분석 {Math.round(percentage)}%</span>
                            </div>
                        </div>
                        <div className="rc-chip-grid">
                            {themeOptions.map(t => (
                                <div key={t} className={`rc-chip ${themes.includes(t) ? 'selected' : ''}`} onClick={() => toggleTheme(t)}>
                                    {t}
                                </div>
                            ))}
                        </div>
                        <div className="rc-bottom" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
                            <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700 }}>선택된 테마</div>
                            <div className="rc-selected-scroll" style={{ marginBottom: 16 }}>
                                {themes.map(t => <div key={t} className="rc-selected-chip-small">{t}</div>)}
                                {themes.length === 0 && <span style={{ fontSize: 12, color: '#b0b0b0' }}>테마를 선택해주세요</span>}
                            </div>
                            <button className="rc-btn-primary" style={{ background: 'linear-gradient(135deg, #e91e63, #9c27b0)' }} onClick={handleNext}>🪄 AI 일정 생성하기</button>
                        </div>
                    </>
                );
            case 5:
                return (
                    <>
                        <div style={{ paddingBottom: '160px' }}>
                            <div className="rc-res-header">
                                <h1 className="rc-res-title">주상님의 취향을<br />듬뿍 담은 {city} 힐링 코스</h1>
                                <p className="rc-res-subtitle">Your {city} Heritage Route</p>
                            </div>

                            <div className="rc-timeline">
                                <div className="rc-time-item">
                                    <div className="rc-time-badge">16:00</div>
                                    <div className="rc-time-card">
                                        <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=200&fit=crop" alt="기요미즈데라" draggable={false} />
                                        <div className="info">
                                            <h4>기요미즈데라(청수사) 산책</h4>
                                            <p>📍 히가시야마구</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rc-time-item">
                                    <div className="rc-time-badge" style={{ borderColor: '#e0e0e0', color: '#b0b0b0' }}>18:00</div>
                                    <div className="rc-time-card">
                                        <img src="https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&h=200&fit=crop" alt="료칸 저녁" draggable={false} />
                                        <div className="info">
                                            <h4>료칸 가이세키 정식</h4>
                                            <p>📍 기온 거리 인근</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                );
            default: return null;
        }
    };

    return (
        <div className="rc-modal">
            <div className={`rc-header ${step === 5 ? '' : 'border'}`}>
                {step === 5 ? (
                    <button className="rc-back-btn" onClick={() => onClose()}>
                        <ChevronLeft />
                    </button>
                ) : (
                    <button className="rc-back-btn" onClick={handlePrev}>
                        <ChevronLeft />
                    </button>
                )}
            </div>
            <div className="rc-content">
                {renderStepContent()}
            </div>
            {step === 5 && (
                <div 
                  className="rc-res-bottom text-center" 
                  style={{ 
                    zIndex: 10,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'white',
                    padding: '16px 20px calc(16px + env(safe-area-inset-bottom))',
                    borderTop: '1px solid #f0f0f0'
                  }}
                >
                    <button className="rc-btn-outline" onClick={() => setStep(1)}>🔄 다른 루트 추천</button>
                    <button className="rc-btn-primary" onClick={onStartJourney}>여행 시작하기</button>
                </div>
            )}
        </div>
    );
}
