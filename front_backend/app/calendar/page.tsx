"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, RotateCcw, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useAi } from '../../context/AiContext';
import CalendarPicker from '../../components/calendar/CalendarPicker';

export default function CalendarPage() {
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleConfirmDates = (start: Date, end: Date) => {
    console.log("Selected dates:", start, end);
    setShowPicker(false);
    // 추후 일정을 다시 생성하거나 필터링하는 로직 추가 가능
    alert(`${start.toLocaleDateString()} ~ ${end.toLocaleDateString()} 일정이 선택되었습니다.`);
  };

  const schedules = [
    { id: 1, time: "10:00", location: "경복궁", category: "관광", description: "한복 체험 및 수문장 교대식 관람", icon: "⛩️", duration: "2시간" },
    { id: 2, time: "13:00", location: "명동교자 본점", category: "식사", description: "점심 식사 (칼국수와 만두)", icon: "🍜", duration: "1시간" },
    { id: 3, time: "15:30", location: "N서울타워", category: "랜드마크", description: "케이블카 탑승 및 서울 전경 관람", icon: "🗼", duration: "1.5시간" },
  ];

  const { hasActiveJourney } = useAi();

  return (
    <>
      <div className="calendar-content">
        {!hasActiveJourney ? (
          <div className="empty-schedule-container">
            <header className="feed-header" style={{ marginBottom: '40px', background: 'transparent', border: 'none' }}>
              <h1 className="feed-header-title">여행 가이드</h1>
            </header>

            <div className="empty-journey-icon-wrapper" style={{ overflow: 'visible' }}>
              <div className="plane-illustration-box">
                <div className="icon-glow-effect"></div>
                <CalendarIcon size={80} color="#8c52ff" strokeWidth={1.5} className="empty-journey-icon" />
                <div className="purple-path"></div>
              </div>
            </div>
            
            <h2 className="empty-journey-title">
              아직 내 일정을<br />생성하지 않았습니다
            </h2>
            
            <p className="empty-journey-subtitle">
              어디로 떠나고 싶으신가요?<br />
              나만의 설레는 여행 일정을 만들어보세요.
            </p>

            <Link href="/?trigger=survey" style={{ textDecoration: 'none' }}>
              <button className="select-destination-btn">
                일정 생성하기 <Plus size={18} />
              </button>
            </Link>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* 캘린더 피커 모달 */}
      {showPicker && (
        <div className="survey-modal" style={{ padding: '0' }}>
          <CalendarPicker 
            onConfirm={handleConfirmDates} 
            onCancel={() => setShowPicker(false)} 
          />
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button 
        className="calendar-fab"
        onClick={() => setShowPicker(true)}
      >
        <Plus size={32} strokeWidth={1.5} />
      </button>
    </>
  );
}