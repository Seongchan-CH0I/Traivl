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
    // - AI 채팅: 'ai_chat'
    const [translationState, setTranslationState] = useState<'idle' | 'camera' | 'result' | 'audio_idle' | 'audio_recording' | 'audio_result' | 'ai_chat'>('idle');
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

    // --- AI Chat State & Handlers ---
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'ai', text: '안녕하세요! 여행을 도와드리는 AI 가이드입니다. 궁금한 점을 물어보세요! 🗺️', time: '오전 10:46' }
    ]);

    const handleAiChatClick = () => {
        setIsAiMenuOpen(false);
        setTranslationState('ai_chat');
    };

    const handleSendChatMessage = (text: string) => {
        if (!text.trim()) return;

        // 사용자 메시지 추가
        const now = new Date();
        const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        
        const newUserMsg = { id: Date.now(), sender: 'user', text, time: timeString };
        setChatMessages(prev => [...prev, newUserMsg]);
        setChatInput('');

        // 하드코딩된 AI 응답 처리 (실제 API 연동 시 이 부분을 fetch API 등으로 교체)
        setTimeout(() => {
            let aiResponse = '죄송합니다. 아직 답변을 드릴 수 없는 질문입니다. 다른 궁금한 점을 물어보세요! 😊';
            
            if (text.includes('화장실')) {
                aiResponse = '현재 위치에서 가장 가까운 화장실은 200m 거리의 편의점 내부에 있습니다. 🚻';
            } else if (text.includes('버스') || text.includes('교통')) {
                aiResponse = '근처 정류장에서 15분마다 시내로 향하는 버스를 이용하실 수 있습니다. 🚌';
            } else if (text.includes('맛집') || text.includes('식당')) {
                aiResponse = '주변에 평점이 높은 현지인 맛집 3곳을 추천해드릴 수 있습니다. 목록을 볼까요? 🍣';
            }
            
            const newAiMsg = { id: Date.now() + 1, sender: 'ai', text: aiResponse, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) };
            setChatMessages(prev => [...prev, newAiMsg]);
        }, 1000);
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
                        <div className={`ai-option-item ${isAiMenuOpen ? 'show' : ''}`} onClick={handleAiChatClick} style={{ cursor: 'pointer' }}>
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

                    {/* --- AI Chat Overlay --- */}
                    {translationState === 'ai_chat' && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: '#fff', zIndex: 9999,
                            display: 'flex', flexDirection: 'column', overflow: 'hidden'
                        }}>
                            {/* 헤더 */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
                                backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ 
                                        width: '8px', height: '8px', borderRadius: '50%', 
                                        backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)' 
                                    }}></span>
                                    <div>
                                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: 0 }}>AI 가이드</h2>
                                        <p style={{ fontSize: '12px', color: '#888', margin: 0, marginTop: '2px' }}>실시간 여행 도우미</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setTranslationState('idle')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                >
                                    <X size={24} color="#333" />
                                </button>
                            </div>

                            {/* 채팅 영역 */}
                            <div style={{
                                flex: 1, overflowY: 'auto', padding: '20px',
                                display: 'flex', flexDirection: 'column', gap: '16px',
                                backgroundColor: '#fcfcfc'
                            }}>
                                {chatMessages.map((msg) => {
                                    const isUser = msg.sender === 'user';
                                    return (
                                        <div key={msg.id} style={{
                                            display: 'flex', flexDirection: 'column', maxWidth: '82%',
                                            alignSelf: isUser ? 'flex-end' : 'flex-start',
                                            alignItems: isUser ? 'flex-end' : 'flex-start'
                                        }}>
                                            <div style={{
                                                padding: '12px 16px',
                                                fontSize: '15px', color: isUser ? '#fff' : '#222',
                                                backgroundColor: isUser ? '#8c52ff' : '#f1f3f5',
                                                border: isUser ? 'none' : '1px solid #e9ecef',
                                                borderRadius: '20px',
                                                borderBottomRightRadius: isUser ? '4px' : '20px',
                                                borderBottomLeftRadius: isUser ? '20px' : '4px',
                                                lineHeight: '1.5',
                                                wordBreak: 'keep-all', overflowWrap: 'break-word',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                            }}>
                                                {msg.text}
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#aaa', marginTop: '6px', padding: '0 4px' }}>
                                                {msg.time}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 하단 입력 영역 */}
                            <div style={{
                                backgroundColor: '#fff', borderTop: '1px solid #f0f0f0',
                                display: 'flex', flexDirection: 'column',
                                paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
                            }}>
                                {/* 자주 묻는 질문 칩 */}
                                <div style={{ padding: '12px 0 8px' }}>
                                    <span style={{ fontSize: '11px', color: '#888', marginLeft: '20px', marginBottom: '8px', display: 'block' }}>자주 묻는 질문</span>
                                    <div style={{ 
                                        display: 'flex', overflowX: 'auto', padding: '0 20px 8px', gap: '10px',
                                        scrollbarWidth: 'none' /* Firefox */
                                    }}>
                                        <style>{`::-webkit-scrollbar { display: none; }`}</style>
                                        <button 
                                            onClick={() => handleSendChatMessage('이 근처 화장실 어디야?')}
                                            style={{ whiteSpace: 'nowrap', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', color: '#555', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                                        >이 근처 화장실 어디야?</button>
                                        <button 
                                            onClick={() => handleSendChatMessage('가장 가까운 역은 어디야?')}
                                            style={{ whiteSpace: 'nowrap', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', color: '#555', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                                        >가장 가까운 역은 어디야?</button>
                                        <button 
                                            onClick={() => handleSendChatMessage('로컬 맛집 추천해줘')}
                                            style={{ whiteSpace: 'nowrap', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', color: '#555', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                                        >로컬 맛집 추천해줘</button>
                                    </div>
                                </div>

                                {/* 입력창 */}
                                <div style={{ padding: '8px 20px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        placeholder="궁금한 점을 물어보세요..." 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSendChatMessage(chatInput);
                                        }}
                                        style={{ 
                                            flex: 1, backgroundColor: '#f1f3f5', border: 'none', borderRadius: '24px', 
                                            padding: '14px 20px', fontSize: '15px', outline: 'none', color: '#333' 
                                        }}
                                    />
                                    <button 
                                        onClick={() => handleSendChatMessage(chatInput)}
                                        style={{ 
                                            width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#8c52ff', 
                                            color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            cursor: 'pointer', boxShadow: '0 4px 12px rgba(140, 82, 255, 0.3)', flexShrink: 0
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}