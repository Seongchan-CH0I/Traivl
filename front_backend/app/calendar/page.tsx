"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, RotateCcw, ChevronRight, Plus, Calendar as CalendarIcon, Share2 } from 'lucide-react';
import { useAi } from '../../context/AiContext';
import { useAuth } from '../../hooks/useAuth';
import CalendarPicker from '../../components/calendar/CalendarPicker';
import CustomAlertModal from '../../components/ui/CustomAlertModal';

export default function CalendarPage() {
  const { user } = useAuth();
  const { hasActiveJourney, setHasActiveJourney, setItineraryData, itineraryData } = useAi();

  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  
  // DB에서 불러온 내 일정 리스트 중 가장 최근 일정을 활성화
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [activeDay, setActiveDay] = useState<number>(1);

  // 공유 모달 상태
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  // Custom Alert 모달 상태
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  // 1. 유저의 최신 일정 DB 로드 함수
  const fetchUserSchedules = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/schedules?userId=${user.id}`);
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        const latest = result.data[0]; // 가장 최근 일정
        setActiveSchedule(latest);
        
        // Context에 일정 데이터 연동 (지도 및 다른 탭 연동을 위해)
        setItineraryData(latest.itineraryData);
        setHasActiveJourney(true);
      } else {
        // DB에 일정이 없으면 빈 상태로 설정
        setActiveSchedule(null);
        if (!itineraryData) {
          setHasActiveJourney(false);
        }
      }
    } catch (error) {
      console.error("Failed to load schedules from DB:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSchedules();
  }, [user]);

  // 다른 추천 루트 새로고침
  const handleRefresh = () => {
    fetchUserSchedules();
  };

  const handleConfirmDates = (start: Date, end: Date) => {
    setShowPicker(false);
    // Custom 알림 띄우기
    setAlertTitle("일정 선택 완료");
    setAlertMsg(`${start.toLocaleDateString()} ~ ${end.toLocaleDateString()} 일정이 선택되었습니다.\n새로운 AI 일정을 생성하려면 홈 화면의 여행 탐색 모달을 이용해 주세요.`);
    setAlertOpen(true);
  };

  // 피드 공유 처리 함수
  const handleShareToFeed = async () => {
    if (!activeSchedule) return;
    setIsSharingLoading(true);
    try {
      const res = await fetch(`/api/schedules/${activeSchedule.id}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isShared: true,
          shareContent: shareContent.trim()
        })
      });

      const result = await res.json();
      if (result.success) {
        setShowShareModal(false);
        setShareContent('');
        
        // 성공 모달 띄우기
        setAlertTitle("공유 성공 ✨");
        setAlertMsg("선택하신 일정이 커뮤니티 피드에 공유되었습니다!\n다른 사용자들이 이 일정을 내 보관함으로 복사할 수 있습니다.");
        setAlertOpen(true);
        
        // 로컬 상태 동기화
        setActiveSchedule({
          ...activeSchedule,
          isShared: true,
          shareContent: shareContent.trim()
        });
      } else {
        alert("일정 공유에 실패했습니다: " + result.message);
      }
    } catch (err) {
      console.error("Failed to share schedule:", err);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setIsSharingLoading(false);
    }
  };

  // 카테고리별 이모지 매핑
  const getCategoryIcon = (category: string) => {
    const cat = category || '';
    if (cat.includes('관광') || cat.includes('역사') || cat.includes('유적')) return '⛩️';
    if (cat.includes('식사') || cat.includes('맛집') || cat.includes('푸드')) return '🍜';
    if (cat.includes('카페') || cat.includes('커피') || cat.includes('디저트')) return '☕';
    if (cat.includes('쇼핑') || cat.includes('마트')) return '🛍️';
    if (cat.includes('힐링') || cat.includes('온천') || cat.includes('자연')) return '🌲';
    if (cat.includes('랜드마크') || cat.includes('야경')) return '🗼';
    return '📍';
  };

  // UI 렌더링용 데이터 정규화
  const displayTitle = activeSchedule?.title || itineraryData?.course_title || "나의 여행 일정";
  const displaySubtitle = activeSchedule?.shareContent || itineraryData?.course_subtitle || "AI가 추천하는 최적의 경로";
  const rawItinerary = activeSchedule?.itineraryData?.itinerary || itineraryData?.itinerary || [];
  
  // 현재 활성화된 Day의 장소 목록
  const currentDayData = rawItinerary.find((d: any) => d.day === activeDay) || rawItinerary[0] || { places: [] };
  const places = currentDayData.places || [];

  return (
    <>
      <div className="calendar-content">
        {!activeSchedule && !itineraryData ? (
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
            <div className="calendar-header" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 className="calendar-title" style={{ fontSize: '20px', fontWeight: 800 }}>{displayTitle}</h1>
                  <p className="calendar-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                    {activeSchedule?.city || "추천 도시"} • {rawItinerary.length}일간의 여정
                  </p>
                </div>
                {activeSchedule && (
                  <button 
                    onClick={() => setShowShareModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: '1.5px solid #8c52ff',
                      backgroundColor: activeSchedule.isShared ? '#f3eeff' : '#ffffff',
                      color: '#8c52ff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Share2 size={14} />
                    {activeSchedule.isShared ? "공유 완료" : "피드에 공유"}
                  </button>
                )}
              </div>
            </div>

            {/* 다른 루트 추천 버튼 */}
            <button
              onClick={handleRefresh}
              className="calendar-refresh-btn"
              disabled={loading}
              style={{ marginTop: '16px' }}
            >
              <RotateCcw size={18} className={`refresh-icon ${loading ? 'spin' : ''}`} />
              새로고침
            </button>

            {/* 일차 탭 스위처 */}
            {rawItinerary.length > 1 && (
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                margin: '16px 0', 
                overflowX: 'auto',
                paddingBottom: '4px'
              }}>
                {rawItinerary.map((dayObj: any) => (
                  <button
                    key={dayObj.day}
                    onClick={() => setActiveDay(dayObj.day)}
                    style={{
                      flexShrink: 0,
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: activeDay === dayObj.day ? '2px solid #8c52ff' : '1px solid #e0e0e0',
                      backgroundColor: activeDay === dayObj.day ? '#f3eeff' : 'white',
                      color: activeDay === dayObj.day ? '#8c52ff' : '#666',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {dayObj.day}일차
                  </button>
                ))}
              </div>
            )}

            {/* 타임라인 리스트 */}
            <div className="calendar-timeline" style={{ marginTop: '10px' }}>
              {places.length > 0 ? (
                places.map((item: any, idx: number) => (
                  <div key={item.place_id || idx} className="timeline-item">
                    {/* 타임라인 원형 포인트 */}
                    <div className="timeline-point-outer">
                      <div className="timeline-point-inner" />
                    </div>

                    {/* 시간 표시 */}
                    <div className="timeline-time" style={{ fontWeight: 700 }}>
                      {item.suggested_time || "10:00"}
                    </div>

                    {/* 일정 카드 */}
                    <div className="timeline-card" style={{ cursor: 'default' }}>
                      <div className="timeline-card-icon">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="timeline-card-content">
                        <div className="timeline-card-header">
                          <h3 className="timeline-card-title">
                            {item.title}
                          </h3>
                          <ChevronRight size={18} className="chevron-icon" />
                        </div>
                        <p className="timeline-card-desc">
                          {item.location}
                        </p>
                        <div className="timeline-card-badges">
                          {item.duration && (
                            <span className="badge-duration">
                              <Clock size={12} style={{ marginRight: '4px' }} /> {item.duration}
                            </span>
                          )}
                          <span className="badge-category">
                            {item.category || "명소"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                  해당 일차의 일정이 존재하지 않습니다.
                </div>
              )}
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

      {/* 피드 공유 모달 */}
      {showShareModal && activeSchedule && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '360px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
              {activeSchedule.isShared ? "공유 한줄평 수정" : "피드에 일정 공유하기"}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', textAlign: 'center', lineHeight: '1.4' }}>
              나의 소중한 여행 경로를 다른 트래블러에게 자랑해보세요!<br />
              한줄평을 작성하면 공유 게시판에 업로드됩니다.
            </p>
            
            <textarea
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
              placeholder="예: 맛집 위주로 짠 실속 가득한 도쿄 2박 3일 힐링 코스입니다! 😊"
              style={{
                width: '100%',
                height: '100px',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                padding: '12px',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleShareToFeed}
                disabled={isSharingLoading || !shareContent.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#8c52ff',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (!shareContent.trim() || isSharingLoading) ? 0.6 : 1
                }}
              >
                {isSharingLoading ? "공유 중..." : "공유하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      <CustomAlertModal
        isOpen={alertOpen}
        type="alert"
        title={alertTitle}
        message={alertMsg}
        onConfirm={() => setAlertOpen(false)}
      />

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