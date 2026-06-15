"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: () => void;
}

export default function LoginScreen({ onBack, onLogin }: LoginScreenProps) {
  const [autoLogin, setAutoLogin] = useState(true);

  return (
    <div className="login-screen-container">
      {/* 상단 헤더 */}
      <div className="login-header-bar">
        <h2 className="login-header-title">로그인</h2>
        <button onClick={onBack} className="login-close-btn">
          <X size={24} />
        </button>
      </div>

      {/* 입력 필드 */}
      <div className="login-form-fields">
        <div className="login-input-wrapper">
          <input
            type="text"
            placeholder="아이디 입력"
            className="login-input login-input-id"
          />
        </div>
        <div className="login-input-wrapper">
          <input
            type="password"
            placeholder="비밀번호 입력"
            className="login-input login-input-pw"
          />
        </div>
      </div>

      {/* 로그인 버튼 */}
      <button onClick={onLogin} className="login-submit-btn">
        로그인
      </button>

      {/* 자동 로그인 체크박스 */}
      <div className="login-autologin-row" onClick={() => setAutoLogin(!autoLogin)}>
        <div className={`login-checkbox ${autoLogin ? 'checked' : ''}`}>
          {autoLogin && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="login-checkbox-icon">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span className="login-autologin-text">자동로그인</span>
      </div>

      {/* 소셜 로그인 버튼 영역 (카카오 제외) */}
      <div className="login-social-container">
        {/* 구글 로그인 */}
        <button onClick={onLogin} className="social-btn google-btn">
          <div className="social-logo-box google-logo-box">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
          </div>
          <span className="social-text">구글 계정으로 로그인</span>
        </button>

        {/* 네이버 로그인 */}
        <button onClick={onLogin} className="social-btn naver-btn">
          <div className="social-logo-box naver-logo-box">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M16.2 2H22v20h-5.8l-8.4-12v12H2V2h5.8l8.4 12V2z" fill="#FFFFFF" />
            </svg>
          </div>
          <span className="social-text">네이버 계정으로 로그인</span>
        </button>
      </div>

      {/* 하단 링크 */}
      <div className="login-footer-links">
        <span onClick={onLogin} className="login-footer-link signup-link">회원가입</span>
      </div>
    </div>
  );
}
