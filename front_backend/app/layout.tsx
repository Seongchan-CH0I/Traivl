import type { Metadata } from 'next';
import './globals.css';
import { Home, AlignRight, Star, Calendar, User } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Traivl',
    description: 'Traivl 풀스택 애플리케이션',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>
                <div className="app-container">
                    <div className="content">
                        {children}
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
                        <button className="nav-item main-action">
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