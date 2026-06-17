"use client";

import React, { useState } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: () => void;
}

export default function LoginScreen({ onBack, onLogin }: LoginScreenProps) {
  const { login, signup } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!id.trim()) {
      setErrorMessage('아이디를 입력해주세요.');
      return;
    }
    if (!password) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }

    if (isSignUp) {
      if (!email.trim()) {
        setErrorMessage('이메일을 입력해주세요.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrorMessage('올바른 이메일 형식을 입력해주세요.');
        return;
      }
      if (!name.trim()) {
        setErrorMessage('이름을 입력해주세요.');
        return;
      }
      if (!confirmPassword) {
        setErrorMessage('비밀번호 확인을 입력해주세요.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signup(id, email, name, password);
        if (result.success) {
          setSuccessMessage('회원가입이 완료되었습니다! 잠시 후 메인 화면으로 이동합니다. ✨');
          setTimeout(() => {
            onLogin();
          }, 1500);
        } else {
          setErrorMessage(result.message);
        }
      } else {
        const result = await login(id, password);
        if (result.success) {
          onLogin();
        } else {
          setErrorMessage(result.message);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage(null);
    setId('');
    setPassword('');
    setEmail('');
    setName('');
    setShowPassword(false);
    setConfirmPassword('');
    setSuccessMessage(null);
  };

  return (
    <div className="login-screen-container">
      {/* 상단 헤더 */}
      <div className="login-header-bar">
        <h2 className="login-header-title">{isSignUp ? '회원가입' : '로그인'}</h2>
        <button onClick={onBack} className="login-close-btn">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 성공 메시지 표시 */}
        {successMessage && (
          <div style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✨</span> {successMessage}
          </div>
        )}

        {/* 에러 메시지 표시 */}
        {errorMessage && (
          <div style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '8px',
            color: '#c53030',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '16px',
            textAlign: 'center',
            wordBreak: 'keep-all'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* 입력 필드 */}
        <div className="login-form-fields">
          <div className="login-input-wrapper">
            <input
              type="text"
              placeholder="아이디 입력"
              className="login-input login-input-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={loading}
            />
          </div>

          {isSignUp && (
            <>
              <div className="login-input-wrapper">
                <input
                  type="email"
                  placeholder="이메일 입력"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="login-input-wrapper">
                <input
                  type="text"
                  placeholder="이름 입력"
                  className="login-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="login-input-wrapper" style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              className="login-input login-input-pw"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ paddingRight: '50px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {isSignUp && (
            <div className="login-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                className="login-input login-input-pw"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '50px' }}
              />
            </div>
          )}
        </div>

        {/* 로그인/회원가입 버튼 */}
        <button 
          type="submit" 
          className="login-submit-btn" 
          disabled={loading}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            backgroundColor: isSignUp ? '#8c52ff' : '#ff5252' 
          }}
        >
          {loading && <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
          {isSignUp ? '회원가입' : '로그인'}
        </button>
      </form>

      {/* 자동 로그인 체크박스 (로그인 모드에서만 표시) */}
      {!isSignUp && (
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
      )}

      {/* 하단 링크 */}
      <div className="login-footer-links" style={{ marginTop: isSignUp ? '40px' : 'auto' }}>
        {isSignUp ? (
          <>
            <span style={{ color: '#888888', marginRight: '4px' }}>이미 회원이신가요?</span>
            <span onClick={toggleMode} className="login-footer-link signup-link" style={{ color: '#ff5252' }}>로그인</span>
          </>
        ) : (
          <>
            <span style={{ color: '#888888', marginRight: '4px' }}>아직 회원이 아니신가요?</span>
            <span onClick={toggleMode} className="login-footer-link signup-link" style={{ color: '#8c52ff' }}>회원가입</span>
          </>
        )}
      </div>
    </div>
  );
}
