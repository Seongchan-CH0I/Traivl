"use client";

import React, { useState } from 'react';
import { Clock, RotateCcw, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const schedules = [
    { id: 1, time: "10:00", location: "경복궁", category: "관광", description: "한복 체험 및 수문장 교대식 관람", icon: "⛩️", duration: "2시간" },
    { id: 2, time: "13:00", location: "명동교자 본점", category: "식사", description: "점심 식사 (칼국수와 만두)", icon: "🍜", duration: "1시간" },
    { id: 3, time: "15:30", location: "N서울타워", category: "랜드마크", description: "케이블카 탑승 및 서울 전경 관람", icon: "🗼", duration: "1.5시간" },
  ];

  return (
    <>
      <div className="calendar-content">
        {/* 상단 헤더 */}
        <div className="calendar-header">
          <h1 className="calendar-title">나의 여행 일정</h1>
          <p className="calendar-subtitle">AI가 추천하는 최적의 경로</p>
        </div>

        {/* 다른 루트 추천 버튼 */}
        <button
          onClick={handleRefresh}
          className="calendar-refresh-btn"
        >
          <RotateCcw size={18} className={`refresh-icon ${loading ? 'spin' : ''}`} />
          다른 루트 추천
        </button>

        {/* 타임라인 리스트 */}
        <div className="calendar-timeline">
          {schedules.map((item) => (
            <div key={item.id} className="timeline-item">
              {/* 타임라인 원형 포인트 */}
              <div className="timeline-point-outer">
                <div className="timeline-point-inner" />
              </div>

              {/* 시간 표시 */}
              <div className="timeline-time">
                {item.time}
              </div>

              {/* 일정 카드 */}
              <div className="timeline-card">
                <div className="timeline-card-icon">
                  {item.icon}
                </div>

                <div className="timeline-card-content">
                  <div className="timeline-card-header">
                    <h3 className="timeline-card-title">
                      {item.location}
                    </h3>
                    <ChevronRight size={18} className="chevron-icon" />
                  </div>
                  <p className="timeline-card-desc">
                    {item.description}
                  </p>
                  <div className="timeline-card-badges">
                    <span className="badge-duration">
                      <Clock size={12} style={{ marginRight: '4px' }} /> {item.duration}
                    </span>
                    <span className="badge-category">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <button className="calendar-fab">
        <span>+</span>
      </button>
    </>
  );
}