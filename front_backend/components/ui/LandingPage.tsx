"use client";

import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  // 아름다운 로컬 여행 이미지들
  const images = [
    '/images/KR_JEJU.jpg',
    '/images/JP_KYOTO.jpg',
    '/images/FR_PARIS.jpg',
    '/images/KR_SEOUL.jpg',
    '/images/JP_OKINAWA.jpg',
    '/images/DE_BERLIN.jpg',
    '/images/KR_BUSAN.jpg',
  ];

  return (
    <div className="landing-container">
      {/* 상단 브랜딩 영역 */}
      <div className="landing-header">
        {/* 로고 이미지 */}
        <div className="landing-logo-wrapper">
          <img src="/images/logo.png" alt="Traivl Logo" className="landing-logo-img" />
        </div>

        {/* 신규 슬로건 텍스트 */}
        <div className="landing-slogan-text">
          "당신만을 위한 완벽한 여정, Traivl"
        </div>
      </div>

      {/* 중앙 무한 스크롤링 이미지 영역 */}
      <div className="landing-marquee-container">
        <div className="landing-marquee-inner">
          <div className="landing-marquee-track animate-marquee">
            {images.map((src, idx) => (
              <div key={`track1-${idx}`} className="landing-image-card">
                <img src={src} alt="Travel Destination" />
              </div>
            ))}
          </div>
          <div className="landing-marquee-track animate-marquee">
            {images.map((src, idx) => (
              <div key={`track2-${idx}`} className="landing-image-card">
                <img src={src} alt="Travel Destination" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 로그인/회원가입 버튼 */}
      <div className="landing-actions">
        <button onClick={onLogin} className="landing-login-btn">
          로그인 / 회원가입
        </button>
      </div>
    </div>
  );
}
