"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAi } from '../../context/AiContext';
import { Dna, Plus } from 'lucide-react';
import Link from 'next/link';
import CustomAlertModal from '../../components/ui/CustomAlertModal';

export default function ProfilePage() {
  const { user, logout, withdraw } = useAuth();
  const { hasActiveJourney } = useAi();
  const [isResetting, setIsResetting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (message: string, title?: string, onConfirm?: () => void) => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

  const showConfirm = (message: string, title?: string, onConfirm?: () => void, onCancel?: () => void) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onCancel) onCancel();
      }
    });
  };

  const handleWithdraw = () => {
    console.log("handleWithdraw clicked! user:", user);
    if (!user?.id) {
      console.log("handleWithdraw: user or user.id is missing!");
      return;
    }
    showConfirm(
      "정말로 회원 탈퇴를 진행하시겠습니까?",
      "회원 탈퇴",
      async () => {
        setIsWithdrawing(true);
        try {
          const res = await withdraw();
          if (res.success) {
            showAlert(res.message, "탈퇴 완료", () => {
              window.location.href = "/";
            });
          } else {
            showAlert(res.message, "탈퇴 실패");
          }
        } catch (e) {
          showAlert("네트워크 통신 중 오류가 발생했습니다.", "오류");
        } finally {
          setIsWithdrawing(false);
        }
      }
    );
  };
  
  const [profileData, setProfileData] = useState<any>(null);
  const [aiUsageHistory, setAiUsageHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileData() {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const [profileRes, historyRes] = await Promise.all([
          fetch(`/api/profile/${user.id}`),
          fetch(`/api/profile/${user.id}/history`)
        ]);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setProfileData(profile);
        }
        if (historyRes.ok) {
          const history = await historyRes.json();
          setAiUsageHistory(history);
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfileData();
  }, [user?.id]);

  const handleResetDna = () => {
    if (!user?.id) return;
    showConfirm(
      "정말 나의 여행 DNA 결과를 완전히 초기화하시겠습니까? (되돌릴 수 없습니다.)",
      "DNA 결과 초기화",
      async () => {
        setIsResetting(true);
        try {
          const res = await fetch(`/api/survey?userId=${user.id}`, { method: 'DELETE' });
          if (res.ok) {
            showAlert("초기화 완료! 앱이 새로고침되어 처음 상태로 돌아갑니다.", "초기화 성공", () => {
              window.location.href = "/";
            });
          } else {
            showAlert("초기화에 실패했습니다.", "오류");
          }
        } catch (e) {
          showAlert("네트워크 통신 중 오류가 발생했습니다.", "오류");
        } finally {
          setIsResetting(false);
        }
      }
    );
  };

  // 서버에서 받아온 실제 취향 데이터 (없을 경우 기본값 50)
  const stats = profileData?.dnaStat ? [
    { label: "문화", value: profileData.dnaStat.culture },
    { label: "음식", value: profileData.dnaStat.food },
    { label: "예산", value: profileData.dnaStat.budget },
    { label: "휴식", value: profileData.dnaStat.relax },
    { label: "호텔", value: profileData.dnaStat.hotel },
    { label: "활동", value: profileData.dnaStat.activity },
  ] : [
    { label: "문화", value: 50 },
    { label: "음식", value: 50 },
    { label: "예산", value: 50 },
    { label: "휴식", value: 50 },
    { label: "호텔", value: 50 },
    { label: "활동", value: 50 },
  ];

  // 그래프 계산 로직
  const getPoint = (index: number, value: number, maxR: number = 100) => {
    const r = (value / 100) * maxR;
    // 위쪽(문화)부터 시계 방향으로 60도씩(PI/3) 회전
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const x = 150 + r * Math.cos(angle);
    const y = 150 + r * Math.sin(angle);
    return { x, y };
  };

  const dataPoints = stats.map((stat, i) => {
    const { x, y } = getPoint(i, stat.value);
    return `${x},${y}`;
  }).join(" ");

  // 배경 육각형 가이드라인을 그리기 위한 단계 
  const levels = [20, 40, 60, 80, 100];

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>프로필 데이터를 불러오는 중입니다...</div>;
  }

  if (!hasActiveJourney) {
    return (
      <div className="profile-empty-container">
        <header className="profile-empty-header" style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>내 정보</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              style={{
                fontSize: '12px', background: '#ffe4e6', color: '#e11d48',
                border: 'none', padding: '6px 12px', borderRadius: '6px',
                cursor: isWithdrawing ? 'not-allowed' : 'pointer', fontWeight: 'bold'
              }}
            >
              {isWithdrawing ? "탈퇴 중..." : "회원 탈퇴 😢"}
            </button>
            <button
              onClick={() => {
                showConfirm("로그아웃 하시겠습니까?", "로그아웃", () => {
                  logout();
                  window.location.href = "/";
                });
              }}
              style={{
                fontSize: '12px', background: '#f1f5f9', color: '#475569',
                border: 'none', padding: '6px 12px', borderRadius: '6px',
                cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              로그아웃 🚪
            </button>
          </div>
        </header>

        <div className="profile-empty-body">
          <div className="dna-icon-wrapper">
            <div className="dna-glow"></div>
            <Dna size={80} className="dna-icon" />
          </div>
          
          <h2 className="profile-empty-title">
            나의 여행 DNA를<br />
            분석하지 않았습니다
          </h2>
          
          <p className="profile-empty-subtitle">
            {user?.name || "회원"}님의 여행 스타일이 궁금하신가요?<br />
            30초 설문으로 맞춤형 정보를 받아보세요!
          </p>
          
          <Link href="/?trigger=survey" className="dna-start-btn">
            DNA 분석 시작하기 +
          </Link>
        </div>
        <CustomAlertModal {...modalConfig} />
      </div>
    );
  }

  return (
    <div className="profile-content">
      {/* 상단 프로필 섹션 */}
      <div className="profile-avatar-section">
        <div className="profile-avatar-outer">
          <div className="profile-avatar-inner">
            <div className="profile-avatar-image">
              <span style={{ fontSize: '30px' }}>👤</span>
            </div>
          </div>
        </div>
      </div>

      <h1 className="profile-title">나의 여행 DNA</h1>
      <p className="profile-subtitle">개인화된 여행 프로필</p>

      {/* DNA 분석 결과 배너 */}
      <div className="profile-dna-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="profile-dna-badge">
            ⚡ DNA 분석 결과
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleResetDna}
              disabled={isResetting}
              style={{
                fontSize: '12px', background: '#ffe4e6', color: '#e11d48',
                border: 'none', padding: '6px 12px', borderRadius: '6px',
                cursor: isResetting ? 'not-allowed' : 'pointer', fontWeight: 'bold'
              }}
            >
              {isResetting ? "삭제 중..." : "결과 데이터 지우기 🗑️"}
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              style={{
                fontSize: '12px', background: '#ffe4e6', color: '#e11d48',
                border: 'none', padding: '6px 12px', borderRadius: '6px',
                cursor: isWithdrawing ? 'not-allowed' : 'pointer', fontWeight: 'bold'
              }}
            >
              {isWithdrawing ? "탈퇴 중..." : "회원 탈퇴 😢"}
            </button>
            <button
              onClick={() => {
                showConfirm("로그아웃 하시겠습니까?", "로그아웃", () => {
                  logout();
                  window.location.href = "/";
                });
              }}
              style={{
                fontSize: '12px', background: '#f1f5f9', color: '#475569',
                border: 'none', padding: '6px 12px', borderRadius: '6px',
                cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              로그아웃 🚪
            </button>
          </div>
        </div>
        <h2 className="profile-dna-result">"{profileData?.dnaType || "여행 DNA 분석 중..."}"</h2>
        <div className="profile-dna-tags">
          <span className="profile-dna-tag">#문화중심</span>
          <span className="profile-dna-tag">#빡빡한일정</span>
          <span className="profile-dna-tag">#가성비맛집</span>
        </div>
      </div>

      {/* 취향 분석 그래프 영역 */}
      <div className="profile-graph-container">
        <h3 className="profile-graph-title">취향 분석 그래프</h3>

        {/* 방사형 SVG 그래프 */}
        <div className="profile-radar-wrapper">
          <svg viewBox="0 0 300 300" className="profile-radar-svg">

            {/* 가이드라인 다각형 (육각형) */}
            {levels.map(level => {
              const points = stats.map((_, i) => {
                const { x, y } = getPoint(i, level);
                return `${x},${y}`;
              }).join(" ");
              return (
                <polygon
                  key={`level-${level}`}
                  points={points}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* 중심에서 뻗어나가는 축 선 */}
            {stats.map((_, i) => {
              const { x, y } = getPoint(i, 100);
              return (
                <line
                  key={`axis-${i}`}
                  x1="150"
                  y1="150"
                  x2={x}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* 실제 취향 데이터 영역 */}
            <polygon
              points={dataPoints}
              fill="rgba(99, 102, 241, 0.35)"
              stroke="#6366f1"
              strokeWidth="2.5"
              style={{ transition: 'all 0.5s ease-out' }}
            />

            {/* 꼭지점 포인트 (선택적) */}
            {stats.map((stat, i) => {
              const { x, y } = getPoint(i, stat.value);
              return (
                <circle
                  key={`dot-${i}`}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#6366f1"
                />
              );
            })}

            {/* 외부 레이블 텍스트 */}
            {stats.map((stat, i) => {
              // 최외곽(100)보다 조금 더 떨어져서 텍스트 표시
              const { x, y } = getPoint(i, 122);
              return (
                <text
                  key={`label-${i}`}
                  x={x}
                  y={y}
                  fill="#334155"
                  fontSize="13"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {stat.label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* AI 기능 활용 기록 영역 (추후 실제 데이터가 들어올 때 aiUsageHistory 상태만 업데이트하면 되도록 구현) */}
      <div className="profile-ai-history-container" style={{ marginTop: '32px' }}>
        <h3 className="profile-graph-title" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🤖</span> AI 기능 활용 기록
        </h3>
        <div className="ai-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {aiUsageHistory.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', background: '#f8fafc', borderRadius: '12px' }}>
              아직 AI 기능 활용 기록이 없습니다.
            </div>
          ) : (
            aiUsageHistory.map((log) => (
            <div key={log.id} className="ai-history-item" style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              border: '1px solid #f0f0f0'
            }}>
              <div className="ai-history-icon" style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {log.icon}
              </div>
              <div className="ai-history-content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111', lineHeight: '1.4' }}>{log.title}</h4>
                  <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : log.date}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #8c52ff' }}>
                  {log.content}
                </p>
              </div>
            </div>
          )))}
        </div>
      </div>
      <CustomAlertModal {...modalConfig} />
    </div>
  );
}