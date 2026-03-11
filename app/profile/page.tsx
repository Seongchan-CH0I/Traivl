"use client";

import React, { useMemo } from 'react';

export default function ProfilePage() {
  // 취향 데이터 예시
  const stats = [
    { label: "문화", value: 90 },
    { label: "음식", value: 65 },
    { label: "예산", value: 45 },
    { label: "휴식", value: 35 },
    { label: "호텔", value: 55 },
    { label: "활동", value: 80 },
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
        <span className="profile-dna-badge">
          ⚡ DNA 분석 결과
        </span>
        <h2 className="profile-dna-result">"전통 탐험가"</h2>
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
    </div>
  );
}