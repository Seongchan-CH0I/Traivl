"use client";

import { useState } from 'react';
import './globals.css';
import { Home, AlignRight, Star, Calendar, User, Camera, Mic, MessageSquare } from 'lucide-react';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

    return (
        <html lang="ko">
            <body>
                <div className="app-container">
                    {/* 어두운 배경 오버레이 */}
                    <div 
                        className={`ai-menu-overlay ${isAiMenuOpen ? 'show' : ''}`} 
                        onClick={() => setIsAiMenuOpen(false)}
                    />

                    <div className="content">
                        {children}
                    </div>

                    {/* AI 팝업 메뉴 버튼들 */}
                    <div className="ai-options-container">
                        <div className={`ai-option-item ${isAiMenuOpen ? 'show' : ''}`}>
                            <button className="ai-circle-btn"><Camera color="#8c52ff" /></button>
                            <span className="ai-option-label">사진 번역</span>
                        </div>
                        <div className={`ai-option-item ${isAiMenuOpen ? 'show' : ''}`}>
                            <button className="ai-circle-btn"><Mic color="#8c52ff" /></button>
                            <span className="ai-option-label">음성 번역</span>
                        </div>
                        <div className={`ai-option-item ${isAiMenuOpen ? 'show' : ''}`}>
                            <button className="ai-circle-btn"><MessageSquare color="#8c52ff" /></button>
                            <span className="ai-option-label">AI 채팅</span>
                        </div>
                    </div>

                    <nav className="bottom-nav">
                        <button className="nav-item active">
                            <Home className="nav-icon" />
                            <span>홈</span>
                        </button>
                        <button className="nav-item">
                            <AlignRight className="nav-icon" />
                            <span>피드</span>
                        </button>
                        
                        {/* AI 메뉴 토글 버튼 */}
                        <button 
                            className={`nav-item main-action ${isAiMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                        >
                            <div className="main-action-circle">
                                <Star className="nav-icon" color="white" fill="white" />
                            </div>
                        </button>

                        <button className="nav-item">
                            <Calendar className="nav-icon" />
                            <span>내 일정</span>
                        </button>
                        <button className="nav-item">
                            <User className="nav-icon" />
                            <span>내 정보</span>
                        </button>
                    </nav>
                </div>
            </body>
        </html>
    );
}