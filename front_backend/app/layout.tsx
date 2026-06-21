"use client";

import { useState, useRef, useEffect } from 'react';
import './globals.css';
import { Home, AlignRight, Star, Calendar, User, Camera, Mic, MessageSquare, X, Check, Image, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AiProvider, useAi } from '../context/AiContext';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import LandingPage from '../components/ui/LandingPage';
import LoginScreen from '../components/ui/LoginScreen';

const renderMessageText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
        const parts = line.split('**');
        return (
            <div key={index} style={{ minHeight: line === '' ? '1.5em' : 'auto' }}>
                {parts.map((part, partIndex) => {
                    if (partIndex % 2 === 1) {
                        return <strong key={partIndex} style={{ fontWeight: '700' }}>{part}</strong>;
                    }
                    return part;
                })}
            </div>
        );
    });
};

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isAiMenuOpen, setIsAiMenuOpen, translationState, setTranslationState, toggleAiMenu, isJourneyMapMode, selectedCity, chatSessionId, dnaResult } = useAi();
    const { user } = useAuth(); // 이제 Context에서 유저 정보를 가져옴
    const [entryStep, setEntryStep] = useState<'landing' | 'login' | 'app'>('landing');

    // 앱 로드 시 기존 세션 유무에 따라 메인 진입 여부 결정
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedUser = localStorage.getItem('traivl_user');
            if (savedUser) {
                setEntryStep('app');
            }
        }
    }, []);

    // 로그아웃 시에만 자동으로 랜딩 화면으로 팅김 처리
    useEffect(() => {
        if (!user) {
            if (typeof window !== 'undefined' && !localStorage.getItem('traivl_user')) {
                setEntryStep('landing');
            }
        }
    }, [user]);

    // --- Vision Lens States & Refs ---
    const [visionImage, setVisionImage] = useState<string | null>(null);
    const [visionResult, setVisionResult] = useState<any | null>(null);
    const [isLoadingVision, setIsLoadingVision] = useState<boolean>(false);
    const [visionError, setVisionError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // --- Voice Recording States & Refs ---
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [voiceResult, setVoiceResult] = useState<any | null>(null);
    const [isLoadingVoice, setIsLoadingVoice] = useState<boolean>(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // WebRTC 카메라 스트림 활성화/비활성화 처리
    useEffect(() => {
        let activeStream: MediaStream | null = null;

        async function startCamera() {
            if (translationState === 'camera') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                    });
                    activeStream = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Camera access error:", err);
                    alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
                    setTranslationState('idle');
                }
            }
        }

        startCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [translationState, setTranslationState]);

    // 비디오 화면 캡처 및 전송
    const handleCapture = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Image = canvas.toDataURL('image/jpeg', 0.85);
            setVisionImage(base64Image);
            sendVisionRequest(base64Image);
        }
    };

    // 갤러리 업로드 트리거
    const triggerGallerySelect = () => {
        fileInputRef.current?.click();
    };

    // 갤러리 파일 로드 및 전송
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Image = reader.result as string;
            setVisionImage(base64Image);
            sendVisionRequest(base64Image);
        };
        reader.readAsDataURL(file);
    };

    // 비전 API 전송 로직
    const sendVisionRequest = async (base64Str: string) => {
        setIsLoadingVision(true);
        setVisionError(null);
        setTranslationState('result');

        try {
            const response = await fetch('/api/vision/lens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_location: selectedCity || "일본 도쿄",
                    image_base64: base64Str,
                    mode: "auto"
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                setVisionResult(data.data);
            } else {
                throw new Error(data.message || "이미지 분석 중 오류가 발생했습니다.");
            }
        } catch (err: any) {
            console.error("Vision request error:", err);
            setVisionError(err.message || "오류가 발생했습니다.");
        } finally {
            setIsLoadingVision(false);
        }
    };

    // 결과 창 닫기 및 상태 초기화
    const handleCloseResult = () => {
        setTranslationState('idle');
        setVisionImage(null);
        setVisionResult(null);
        setVisionError(null);
    };
    const pathname = usePathname();

    // --- Translation Mock Data ---
    const mockTranslationData = [
        { id: 1, original: "豚骨ラーメン", translated: "돈코츠 라멘", priceOriginal: "¥890", priceKrw: "₩9,800" },
        { id: 2, original: "餃자 (5개)", translated: "교자 (5개)", priceOriginal: "¥480", priceKrw: "₩5,300" },
        { id: 3, original: "チャーシュー麺", translated: "차슈 라멘", priceOriginal: "¥1,100", priceKrw: "₩12,100" }
    ];

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

    const handlePhotoTranslateClick = () => {
        setIsAiMenuOpen(false);
        setTranslationState('camera');
    };

    const handleAudioTranslateClick = () => {
        setIsAiMenuOpen(false);
        setTranslationState('audio_idle');
    };

    const startRecording = async () => {
        setVoiceError(null);
        setVoiceResult(null);
        audioChunksRef.current = [];
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 브라우저 포맷 감지
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/mp4';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = '';
                }
            }
            
            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
                setAudioBlob(recordedBlob);
                
                // 마이크 리소스 즉시 해제
                stream.getTracks().forEach(track => track.stop());
                
                // API 전송
                sendVoiceRequest(recordedBlob);
            };
            
            mediaRecorder.start();
            setTranslationState('audio_recording');
            
            // 5초 후 자동으로 녹음 중지
            const autoStopTimeout = setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            }, 5000);
            
        } catch (err: any) {
            console.error("Microphone access error:", err);
            alert("마이크에 접근할 수 없습니다. 권한을 확인해주세요.");
            setTranslationState('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const sendVoiceRequest = async (blob: Blob) => {
        setIsLoadingVoice(true);
        setTranslationState('audio_result');
        setVoiceError(null);
        
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Str = reader.result as string;
                
                try {
                    const response = await fetch('/api/voice/interpreter', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_location: selectedCity || "일본 도쿄",
                            audio_base64: base64Str
                        })
                    });
                    
                    const data = await response.json();
                    if (data.status === 'success') {
                        setVoiceResult(data.data);
                    } else {
                        throw new Error(data.message || "음성 통역에 실패했습니다.");
                    }
                } catch (err: any) {
                    console.error("Voice interpret request error:", err);
                    setVoiceError(err.message || "오류가 발생했습니다.");
                } finally {
                    setIsLoadingVoice(false);
                }
            };
            reader.readAsDataURL(blob);
        } catch (err: any) {
            console.error("File reading error:", err);
            setVoiceError("녹음 파일 처리에 실패했습니다.");
            setIsLoadingVoice(false);
        }
    };

    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'ai', text: '안녕하세요! 여행을 도와드리는 AI 가이드입니다. 궁금한 점을 물어보세요! 🗺️', time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const [isStreaming, setIsStreaming] = useState(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    // 채팅 스크롤 자동 하단 이동
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleAiChatClick = () => {
        setIsAiMenuOpen(false);
        setTranslationState('ai_chat');
    };

    const getTimeString = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    const handleSendChatMessage = async (text: string) => {
        if (!text.trim() || isStreaming) return;

        // 1. 사용자 메시지 즉시 표시
        const userMsg = { id: Date.now(), sender: 'user', text, time: getTimeString() };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsStreaming(true);
        // 2. AI 응답 placeholder 추가
        const aiMsgId = Date.now() + 1;
        setChatMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '', time: '' }]);

        let isStreamDone = false;
        let typingInterval: any = null;

        try {
            // 3. SSE 스트림 연결
            const response = await fetch('/api/chat/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id || 'anonymous',
                    user_name: user?.name || 'User',
                    current_location: selectedCity || null,
                    message: text,
                    dna_type: dnaResult?.type || null,
                    chat_history_id: chatSessionId,
                })
            });

            if (!response.ok || !response.body) {
                throw new Error('AI 서버 응답 오류');
            }
            // 4. SSE 이벤트 파싱 및 실시간 렌더링
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            let accumulatedText = '';
            let displayedText = '';
            // 타이핑 연출용 인터벌 설정 (20ms마다 최대 2글자씩 출력)
            typingInterval = setInterval(() => {
                if (displayedText.length < accumulatedText.length) {
                    const charsToType = Math.min(2, accumulatedText.length - displayedText.length);
                    displayedText += accumulatedText.substring(displayedText.length, displayedText.length + charsToType);
                    setChatMessages(prev => prev.map(msg =>
                        msg.id === aiMsgId
                            ? { ...msg, text: displayedText, time: getTimeString() }
                            : msg
                    ));
                } else if (isStreamDone) {
                    clearInterval(typingInterval);
                    setIsStreaming(false);
                }
            }, 20);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const chunk = JSON.parse(line.slice(6));
                            if (chunk.type === 'token') {
                                accumulatedText += chunk.content;
                            } else if (chunk.type === 'error') {
                                accumulatedText = chunk.content || '오류가 발생했습니다. 다시 시도해주세요.';
                                isStreamDone = true;
                            } else if (chunk.type === 'done') {
                                isStreamDone = true;
                            }
                        } catch (parseErr) {
                            // 파싱 에러 무시
                        }
                    }
                }
            }

            isStreamDone = true;

        } catch (err: any) {
            console.error('Chat SSE error:', err);
            if (typingInterval) clearInterval(typingInterval);
            setChatMessages(prev => prev.map(msg =>
                msg.id === aiMsgId
                    ? { ...msg, text: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요. 🔄', time: getTimeString() }
                    : msg
            ));
            setIsStreaming(false);
        } finally {
            isStreamDone = true;
            if (!typingInterval) {
                setIsStreaming(false);
            }
        }    };

    if (entryStep === 'landing') {
        return (
            <div className="app-container">
                <LandingPage onLogin={() => setEntryStep('login')} />
            </div>
        );
    }

    if (entryStep === 'login') {
        return (
            <div className="app-container">
                <LoginScreen 
                    onBack={() => setEntryStep('landing')} 
                    onLogin={() => setEntryStep('app')} 
                />
            </div>
        );
    }

    return (
        <div className="app-container">
            <div
                className={`ai-menu-overlay ${isAiMenuOpen ? 'show' : ''}`}
                onClick={() => setIsAiMenuOpen(false)}
            />

            <div className="content">
                {children}
            </div>

            <div className={`ai-options-container ${isJourneyMapMode ? 'on-map' : ''}`}>
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

            {!isJourneyMapMode && (
                <nav className="bottom-nav">
                    <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
                        <Home className="nav-icon" />
                        <span>홈</span>
                    </Link>
                    <Link href="/feed" className={`nav-item ${pathname === '/feed' ? 'active' : ''}`}>
                        <AlignRight className="nav-icon" />
                        <span>피드</span>
                    </Link>
                    <button
                        className={`nav-item main-action ${isAiMenuOpen ? 'active' : ''}`}
                        onClick={toggleAiMenu}
                    >
                        <div className="main-action-circle">
                            <Star className="nav-icon" color="white" fill="white" />
                        </div>
                    </button>
                    <Link href="/calendar" className={`nav-item ${pathname === '/calendar' ? 'active' : ''}`}>
                        <Calendar className="nav-icon" />
                        <span>내 일정</span>
                    </Link>
                    <Link href="/profile" className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}>
                        <User className="nav-icon" />
                        <span>내 정보</span>
                    </Link>
                </nav>
            )}

            {/* --- Overlays --- */}
            {(translationState === 'camera' || translationState === 'result') && (
                <div className="translation-overlay">
                    {translationState === 'camera' && (
                        <>
                            <div className="camera-header">
                                <button className="camera-close-btn" onClick={() => setTranslationState('idle')}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="camera-viewfinder-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                <div className="camera-video-wrapper" style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '280px',
                                    aspectRatio: '3/4',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
                                    border: '2px solid rgba(255, 255, 255, 0.15)',
                                    backgroundColor: '#000'
                                }}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="camera-video"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <div className="camera-frame-overlay" style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        pointerEvents: 'none'
                                    }}>
                                        <div className="camera-frame" style={{
                                            width: '90%',
                                            height: '90%',
                                            border: '1px dashed rgba(255, 255, 255, 0.4)',
                                            position: 'relative',
                                            borderRadius: '12px',
                                            maxWidth: 'none',
                                            aspectRatio: 'auto',
                                            display: 'block'
                                        }}>
                                            <div className="camera-frame-br" />
                                        </div>
                                    </div>
                                </div>
                                <p className="camera-instructions" style={{ color: 'white', fontSize: '14px', fontWeight: 500, marginTop: '24px', marginBottom: '16px', letterSpacing: '-0.02em' }}>번역하고 싶은 내용을 비춰주세요</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <div className="camera-actions-container" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                maxWidth: '280px',
                                padding: '0 10px',
                                margin: '0 auto 32px'
                            }}>
                                <button className="gallery-select-btn" onClick={triggerGallerySelect} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    opacity: 0.85
                                }}>
                                    <Image size={22} color="white" />
                                    <span>갤러리</span>
                                </button>
                                <button className="camera-shutter-btn-circle" onClick={handleCapture} style={{
                                    width: '68px',
                                    height: '68px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                    border: '4px solid white',
                                    padding: '3px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div className="camera-shutter-inner" style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        backgroundColor: 'white',
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                                    }} />
                                </button>
                                <div style={{ width: 75 }} />
                            </div>
                        </>
                    )}
                    {translationState === 'result' && (
                        <div className="result-container">
                            {isLoadingVision ? (
                                <div className="vision-loading-container">
                                    <div className="vision-loading-spinner-wrapper">
                                        <div className="vision-loading-pulse" />
                                        <Loader2 size={32} className="vision-loading-icon" />
                                    </div>
                                    <h3 className="vision-loading-title">AI 스마트 분석 중</h3>
                                    <p className="vision-loading-desc">텍스트를 번역하고 현지 상황과 에티켓을 해설하는 중입니다...</p>
                                </div>
                            ) : visionError ? (
                                <div className="vision-error-container">
                                    <X size={48} color="#ef4444" />
                                    <h3 className="vision-error-title">분석 오류</h3>
                                    <p className="vision-error-desc">{visionError}</p>
                                    <button className="vision-retry-btn" onClick={() => {
                                        if (visionImage) sendVisionRequest(visionImage);
                                    }}>다시 시도</button>
                                </div>
                            ) : visionResult ? (
                                <>
                                    <div className="result-image-wrapper">
                                        <img src={visionImage || "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=800"} alt="Captured View" />
                                    </div>
                                    <div className="result-content">
                                        <div className="result-header">
                                            <div className="result-type-badge">
                                                {visionResult.identified_type === 'menu' ? '🍴 메뉴판' :
                                                 visionResult.identified_type === 'sign' ? '🛑 표지판' :
                                                 visionResult.identified_type === 'landmark' ? '🏛️ 랜드마크' :
                                                 visionResult.identified_type === 'object' ? '📦 사물' : '🔍 스마트 렌즈'}
                                            </div>
                                            <h2 className="result-title">{visionResult.main_subject}</h2>
                                        </div>
                                        
                                        <p className="result-overview">{visionResult.overview}</p>
                                        
                                        <div className="result-section-label">📋 분석 항목 ({visionResult.items ? visionResult.items.length : 0})</div>
                                        <div className="result-list">
                                            {visionResult.items && visionResult.items.map((item: any, idx: number) => (
                                                <div key={idx} className="result-item-card">
                                                    <div className="result-item-top">
                                                        <div className="result-item-original-box">
                                                            <span className="result-item-original-label">원문</span>
                                                            <span className="result-item-original-text">{item.name}</span>
                                                        </div>
                                                        <div className="result-item-arrow">→</div>
                                                        <div className="result-item-translated-box">
                                                            <span className="result-item-translated-label">번역</span>
                                                            <span className="result-item-translated-text">{item.translated_name}</span>
                                                        </div>
                                                    </div>
                                                    <p className="result-item-explanation">{item.explanation}</p>
                                                    {item.cultural_context && (
                                                        <div className="result-item-tip">
                                                            <span className="result-item-tip-icon">💡</span>
                                                            <p className="result-item-tip-text">{item.cultural_context}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {visionResult.cultural_context && (
                                            <div className="result-etiquette-card">
                                                <div className="result-etiquette-header">
                                                    <span className="result-etiquette-icon">💡</span>
                                                    <h3 className="result-etiquette-title">제 생각(분석) 포인트 & 에티켓 가이드</h3>
                                                </div>
                                                <p className="result-etiquette-text">{visionResult.cultural_context}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : null}
                            
                            <button className="result-close-btn" onClick={handleCloseResult}>닫기</button>
                        </div>
                    )}
                </div>
            )}

            {(translationState === 'audio_idle' || translationState === 'audio_recording' || translationState === 'audio_result') && (
                <div className="audio-overlay">
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
                                        <button className="audio-mic-btn" onClick={startRecording}>
                                            <Mic size={50} color="#7e22ce" strokeWidth={2.5} />
                                        </button>
                                        <p className="audio-instruction">음성 인식을 원하시면 마이크 버튼을 눌러주세요</p>
                                    </>
                                ) : (
                                    <>
                                        <button className="audio-mic-btn recording" onClick={stopRecording} style={{ animation: 'none' }}>
                                            <Mic size={50} color="#ef4444" strokeWidth={2.5} />
                                        </button>
                                        <div className="audio-waves">
                                            {[...Array(15)].map((_, i) => (
                                                <div key={i} className="audio-wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                                            ))}
                                        </div>
                                        <p className="audio-instruction">듣는 중...</p>
                                        <p className="audio-sub-instruction">마이크 버튼을 한 번 더 누르면 녹음이 중지됩니다</p>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                    {translationState === 'audio_result' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                            {isLoadingVoice ? (
                                <div className="vision-loading-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', background: 'radial-gradient(circle at center, #7e22ce 0%, #6b21a8 100%)', color: 'white' }}>
                                    <div className="vision-loading-spinner-wrapper" style={{ marginBottom: '24px' }}>
                                        <div className="vision-loading-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                                        <Loader2 size={32} className="vision-loading-icon" style={{ color: 'white' }} />
                                    </div>
                                    <h3 className="vision-loading-title" style={{ color: 'white', fontSize: '19px', fontWeight: '800' }}>AI 음성 분석 및 통역 중</h3>
                                    <p className="vision-loading-desc" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13.5px', maxWidth: '260px' }}>음성을 인식하여 상황 분석 및 추천 대답을 매핑하고 있습니다...</p>
                                </div>
                            ) : voiceError ? (
                                <div className="vision-error-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', color: 'white' }}>
                                    <X size={48} color="#ef4444" />
                                    <h3 className="vision-error-title" style={{ color: 'white', fontSize: '19px', fontWeight: '800', marginTop: '16px' }}>분석 오류</h3>
                                    <p className="vision-error-desc" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13.5px', marginBottom: '24px' }}>{voiceError}</p>
                                    <button className="vision-retry-btn" style={{ backgroundColor: 'white', color: '#7e22ce' }} onClick={() => {
                                        if (audioBlob) sendVoiceRequest(audioBlob);
                                    }}>다시 시도</button>
                                </div>
                            ) : voiceResult ? (
                                <div className="audio-result-wrapper">
                                    <div className="audio-result-card">
                                        <div className="audio-alert-badge">
                                            <div className="audio-alert-icon">💡</div>
                                            <div className="audio-alert-text">실시간 번역 및 분석</div>
                                        </div>
                                        
                                        <div className="audio-result-section">
                                            <span className="audio-result-label">상황/의도 분석</span>
                                            <p className="audio-result-desc" style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{voiceResult.intent_analysis}</p>
                                        </div>

                                        <div className="audio-result-section">
                                            <span className="audio-result-label">번역 결과</span>
                                            <span className="audio-result-translated" style={{ color: '#8c52ff' }}>{voiceResult.translated_text}</span>
                                        </div>

                                        <div className="audio-result-section">
                                            <span className="audio-result-label">문화 팁 & 에티켓</span>
                                            <p className="audio-result-desc" style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>{voiceResult.cultural_context}</p>
                                        </div>

                                        <div className="audio-result-section">
                                            <span className="audio-result-label" style={{ marginBottom: '6px' }}>추천 대답 (현지 표현)</span>
                                            <div className="audio-response-list">
                                                <div className="audio-response-btn" style={{ cursor: 'default' }}>
                                                    <span className="audio-response-primary" style={{ color: '#8c52ff' }}>{voiceResult.suggested_reply_ko}</span>
                                                    <span className="audio-response-secondary">상황에 맞게 이 문장으로 답변해 보세요!</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="audio-bottom-actions" style={{ position: 'relative', bottom: 'auto', left: 'auto', right: 'auto', padding: '20px', display: 'flex', gap: '10px' }}>
                                <button className="audio-action-btn audio-btn-primary" style={{ flex: 1 }} onClick={() => setTranslationState('audio_idle')}>다시 사용하기</button>
                                <button className="audio-action-btn audio-btn-secondary" style={{ flex: 1 }} onClick={() => {
                                    setTranslationState('idle');
                                    setAudioBlob(null);
                                    setVoiceResult(null);
                                    setVoiceError(null);
                                }}>닫기</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {translationState === 'ai_chat' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)' }}></span>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: 0 }}>AI 가이드</h2>
                                <p style={{ fontSize: '12px', color: '#888', margin: 0, marginTop: '2px' }}>실시간 여행 도우미</p>
                            </div>
                        </div>
                        <button onClick={() => setTranslationState('idle')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <X size={24} color="#333" />
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fcfcfc' }}>
                        {chatMessages.map((msg) => {
                            const isUser = msg.sender === 'user';
                            const isEmptyAi = !isUser && msg.text === '' && isStreaming;
                            return (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', maxWidth: '82%', alignSelf: isUser ? 'flex-end' : 'flex-start', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ padding: '12px 16px', fontSize: '15px', color: isUser ? '#fff' : '#222', backgroundColor: isUser ? '#8c52ff' : '#f1f3f5', border: isUser ? 'none' : '1px solid #e9ecef', borderRadius: '20px', borderBottomRightRadius: isUser ? '4px' : '20px', borderBottomLeftRadius: isUser ? '20px' : '4px', lineHeight: '1.5', wordBreak: 'keep-all', overflowWrap: 'break-word', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', minHeight: isEmptyAi ? '24px' : 'auto' }}>
                                        {isEmptyAi ? (
                                            <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8c52ff', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0s' }}></span>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8c52ff', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.2s' }}></span>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8c52ff', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.4s' }}></span>
                                            </span>
                                        ) : renderMessageText(msg.text)}
                                    </div>
                                    {msg.time && <span style={{ fontSize: '11px', color: '#aaa', marginTop: '6px', padding: '0 4px' }}>{msg.time}</span>}
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                    <div style={{ backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                        <div style={{ padding: '12px 0 8px' }}>
                            <span style={{ fontSize: '11px', color: '#888', marginLeft: '20px', marginBottom: '8px', display: 'block' }}>자주 묻는 질문</span>
                            <div style={{ display: 'flex', overflowX: 'auto', padding: '0 20px 8px', gap: '10px', scrollbarWidth: 'none' }}>
                                <style>{`::-webkit-scrollbar { display: none; }`}</style>
                                <button onClick={() => handleSendChatMessage('이 근처 화장실 어디야?')} style={{ whiteSpace: 'nowrap', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', color: '#555', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>이 근처 화장실 어디야?</button>
                                <button onClick={() => handleSendChatMessage('가장 가까운 역은 어디야?')} style={{ whiteSpace: 'nowrap', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', color: '#555', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>가장 가까운 역은 어디야?</button>
                                <button onClick={() => handleSendChatMessage('로컬 맛집 추천해줘')} style={{ whiteSpace: 'nowrap', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', color: '#555', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>로컬 맛집 추천해줘</button>
                            </div>
                        </div>
                        <div style={{ padding: '8px 20px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input type="text" placeholder={isStreaming ? "AI가 답변 중..." : "궁금한 점을 물어보세요..."} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSendChatMessage(chatInput); }} disabled={isStreaming} style={{ flex: 1, backgroundColor: '#f1f3f5', border: 'none', borderRadius: '24px', padding: '14px 20px', fontSize: '15px', outline: 'none', color: '#333', opacity: isStreaming ? 0.6 : 1 }} />
                            <button onClick={() => handleSendChatMessage(chatInput)} disabled={isStreaming || !chatInput.trim()} style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: isStreaming ? '#ccc' : '#8c52ff', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isStreaming ? 'not-allowed' : 'pointer', boxShadow: isStreaming ? 'none' : '0 4px 12px rgba(140, 82, 255, 0.3)', flexShrink: 0, transition: 'all 0.2s ease' }}><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AuthProvider>
                    <AiProvider>
                        <LayoutContent>
                            {children}
                        </LayoutContent>
                    </AiProvider>
                </AuthProvider>
            </body>
        </html>
    );
}