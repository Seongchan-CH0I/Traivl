"use client";

import { useState } from 'react';
import './globals.css';
import { Home, AlignRight, Star, Calendar, User, Camera, Mic, MessageSquare, X, Check } from 'lucide-react';
import Link from 'next/link'; 
import { usePathname } from 'next/navigation'; 

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    // 상태 정의: 
    // - 사진 번역: 'camera', 'result'
    // - 음성 번역: 'audio_idle', 'audio_recording', 'audio_result'
    const [translationState, setTranslationState] = useState<'idle' | 'camera' | 'result' | 'audio_idle' | 'audio_recording' | 'audio_result'>('idle');
    const pathname = usePathname(); 
    
    // --- Translation Mock Data ---
    // 실제 백엔드 AI 연동 시, 이 부분을 서버에서 받아온 데이터로 세팅하면 됩니다.
    // [사진 번역 Mock]
    const mockTranslationData = [
        { id: 1, original: "豚骨ラーメン", translated: "돈코츠 라멘", priceOriginal: "¥890", priceKrw: "₩9,800" },
        { id: 2, original: "餃子 (5個)", translated: "교자 (5개)", priceOriginal: "¥480", priceKrw: "₩5,300" },
        { id: 3, original: "チャーシュー麺", translated: "차슈 라멘", priceOriginal: "¥1,100", priceKrw: "₩12,100" }
    ];

    // [음성 번역 Mock]
    const mockAudioData = {
        title: "주의",
        originalText: "アツイデス",
        pronunciation: "(아츠이데스)",
        translatedWarning: "음식이 매우 뜨겁습니다",
        translatedDesc: "종업원이 뜨거운 음식을 서빙하면서 주의를 당부하고 있습니다. 조심해서 드세요!",
        responses: [
            { primary: "ありがとうございます", secondary: "아리가또 고자이마스 (감사합니다)" },
            { primary: "気をつけます", secondary: "키오 츠케마스 (조심할게요)" }
        ]
    };

    // AI 메뉴에서 사진 번역 클릭 시
    const handlePhotoTranslateClick = () => {
        setIsAiMenuOpen(false);
        setTranslationState('camera');
    };

    // AI 메뉴에서 음성 번역 클릭 시
    const handleAudioTranslateClick = () => {
        setIsAiMenuOpen(false);
        setTranslationState('audio_idle');
    };

    // 마이크 버튼 클릭 => 녹음 시작
    const handleStartRecording = () => {
        setTranslationState('audio_recording');
        
        // 2.5초 후 자동으로 결과 화면 등장 (API 호출 대용)
        setTimeout(() => {
            // 녹음 상태일 때만 결과로 넘어가도록 (사용자가 그 전에 닫았을 수 있음)
            setTranslationState((prev) => prev === 'audio_recording' ? 'audio_result' : prev);
        }, 2500);
    };

    return (
        <html lang="ko" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <div className="app-container">
                    <div 
                        className={`ai-menu-overlay ${isAiMenuOpen ? 'show' : ''}`} 
                        onClick={() => setIsAiMenuOpen(false)}
                    />

                    <div className="content">
                        {children}
                    </div>

                    {/* AI 메뉴 옵션들 */}
                    <div className="ai-options-container">
                        <div className={`ai-option-item ${isAiMenuOpen ? 'show' : ''}`} onClick={handlePhotoTranslateClick} style={{ cursor: 'pointer' }}>
                            <button className="ai-circle-btn"><Camera color="#8c52ff" /></button>
                            <span className="ai-option-label">사진 번역</span>
                        </div>
                        <div className={`ai-option-item ${isAiMenuOpen ? 'show' : ''}`} onClick={handleAudioTranslateClick} style={{ cursor: 'pointer' }}>
                            <button className="ai-circle-btn"><Mic color="#8c52ff" /></button>
                            <span className="ai-option-label">음성 번역</span>
                        </div>
                        <div className={`ai-option-item ${isAiMenuOpen ? 'show' : ''}`}>
                            <button className="ai-circle-btn"><MessageSquare color="#8c52ff" /></button>
                            <span className="ai-option-label">AI 채팅</span>
                        </div>
                    </div>

                    <nav className="bottom-nav">
                        {/* 홈 버튼 */}
                        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
                            <Home className="nav-icon" />
                            <span>홈</span>
                        </Link>

                        {/* 피드 버튼 */}
                        <Link href="/feed" className={`nav-item ${pathname === '/feed' ? 'active' : ''}`}>
                            <AlignRight className="nav-icon" />
                            <span>피드</span>
                        </Link>
                        
                        {/* 중앙 AI 액션 버튼 */}
                        <button 
                            className={`nav-item main-action ${isAiMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                        >
                            <div className="main-action-circle">
                                <Star className="nav-icon" color="white" fill="white" />
                            </div>
                        </button>

                        {/* 내 일정 버튼 */}
                        <Link href="/calendar" className={`nav-item ${pathname === '/calendar' ? 'active' : ''}`}>
                            <Calendar className="nav-icon" />
                            <span>내 일정</span>
                        </Link>

                        {/* ✅ 수정됨: 내 정보 버튼 (클릭 시 /profile로 이동) */}
                        <Link href="/profile" className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}>
                            <User className="nav-icon" />
                            <span>내 정보</span>
                        </Link>
                    </nav>

                    {/* --- Translation Feature Overlay --- */}
                    {(translationState === 'camera' || translationState === 'result') && (
                        <div className="translation-overlay">
                            {translationState === 'camera' && (
                                <>
                                    <div className="camera-header">
                                        <button className="camera-close-btn" onClick={() => setTranslationState('idle')}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="camera-viewfinder-container">
                                        <div className="camera-frame">
                                            <div className="camera-frame-br" />
                                            <Camera size={48} color="rgba(255,255,255,0.3)" />
                                        </div>
                                        <p className="camera-instructions">번역하고 싶은 내용을 비춰주세요</p>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button className="camera-shutter-btn" onClick={() => setTranslationState('result')}>
                                            촬영하기
                                        </button>
                                    </div>
                                </>
                            )}

                            {translationState === 'result' && (
                                <div className="result-container">
                                    <div className="result-image-wrapper">
                                        <img src="https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=800" alt="Captured Menu" />
                                    </div>
                                    
                                    <div className="result-content">
                                        <div className="result-header">
                                            <Check color="#10b981" size={24} strokeWidth={3} />
                                            <h2 className="result-title">번역 완료</h2>
                                        </div>
                                        
                                        <div className="result-list">
                                            {mockTranslationData.map((item) => (
                                                <div key={item.id} className="result-item">
                                                    <div className="result-item-left">
                                                        <span className="result-item-original">{item.original}</span>
                                                        <span className="result-item-original" style={{ opacity: 0.5 }}>{item.priceOriginal}</span>
                                                    </div>
                                                    <div className="result-item-left" style={{ alignItems: 'flex-end' }}>
                                                        <span className="result-item-translated">{item.translated}</span>
                                                        <span className="result-item-price-krw">{item.priceKrw}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <button className="result-close-btn" onClick={() => setTranslationState('idle')}>
                                        닫기
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Audio Translation Overlay --- */}
                    {(translationState === 'audio_idle' || translationState === 'audio_recording' || translationState === 'audio_result') && (
                        <div className="audio-overlay">
                            {/* audio_idle & audio_recording 화면 (상단 닫기, 마이크, 애니메이션) */}
                            {(translationState === 'audio_idle' || translationState === 'audio_recording') && (
                                <>
                                    <div className="audio-header">
                                        <button className="camera-close-btn" onClick={() => setTranslationState('idle')}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="audio-main-area">
                                        {translationState === 'audio_idle' ? (
                                            <>
                                                <button className="audio-mic-btn" onClick={handleStartRecording}>
                                                    <Mic size={50} color="#7e22ce" strokeWidth={2.5} />
                                                </button>
                                                <p className="audio-instruction">음성 인식을 원하시면 마이크 버튼을 눌러주세요</p>
                                            </>
                                        ) : (
                                            <>
                                                {/* 녹음 중 UI */}
                                                <div className="audio-mic-btn recording">
                                                    <Mic size={50} color="#7e22ce" strokeWidth={2.5} />
                                                </div>
                                                <div className="audio-waves">
                                                    {/* 파동 애니메이션 바 여러 개 반복 */}
                                                    {[...Array(15)].map((_, i) => (
                                                        <div key={i} className="audio-wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                                                    ))}
                                                </div>
                                                <p className="audio-instruction">듣는 중...</p>
                                                <p className="audio-sub-instruction">주변 소리를 분석하고 있습니다</p>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* audio_result 화면 (결과 카드 UI) */}
                            {translationState === 'audio_result' && (
                                <>
                                    <div className="audio-result-wrapper">
                                        <div className="audio-result-card">
                                            {/* 주의 배지 */}
                                            <div className="audio-alert-badge">
                                                <div className="audio-alert-icon">!</div>
                                                <div className="audio-alert-text">
                                                    🚨 {mockAudioData.title}
                                                </div>
                                            </div>

                                            {/* 인식된 음성 */}
                                            <div className="audio-result-section">
                                                <span className="audio-result-label">인식된 음성</span>
                                                <span className="audio-result-original">{mockAudioData.originalText}</span>
                                                <span className="audio-result-pronunciation">{mockAudioData.pronunciation}</span>
                                            </div>

                                            {/* 번역 및 분석 */}
                                            <div className="audio-result-section">
                                                <span className="audio-result-label">번역 및 분석</span>
                                                <span className="audio-result-translated">{mockAudioData.translatedWarning}</span>
                                                <p className="audio-result-desc">{mockAudioData.translatedDesc}</p>
                                            </div>

                                            {/* 대답하기 옵션들 */}
                                            <div className="audio-result-section">
                                                <span className="audio-result-label" style={{ marginBottom: '4px' }}>대답하기</span>
                                                <div className="audio-response-list">
                                                    {mockAudioData.responses.map((resp, idx) => (
                                                        <button key={idx} className="audio-response-btn">
                                                            <span className="audio-response-primary">{resp.primary}</span>
                                                            <span className="audio-response-secondary">{resp.secondary}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 하단 고정 버튼 두 개 */}
                                    <div className="audio-bottom-actions">
                                        <button className="audio-action-btn audio-btn-primary" onClick={() => setTranslationState('audio_idle')}>
                                            다시 사용하기
                                        </button>
                                        <button className="audio-action-btn audio-btn-secondary" onClick={() => setTranslationState('idle')}>
                                            닫기
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}