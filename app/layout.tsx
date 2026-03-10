"use client";

import { useState } from 'react';
import './globals.css';
import { Home, AlignRight, Star, Calendar, User, Camera, Mic, MessageSquare } from 'lucide-react';
import Link from 'next/link'; 
import { usePathname } from 'next/navigation'; 

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const pathname = usePathname(); 

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
                </div>
            </body>
        </html>
    );
}