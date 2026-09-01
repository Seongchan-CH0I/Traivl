"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, RotateCcw, ChevronRight, Plus, Calendar as CalendarIcon, Share2, Navigation } from 'lucide-react';
import { useAi } from '../../context/AiContext';
import { useAuth } from '../../hooks/useAuth';
import CalendarPicker from '../../components/calendar/CalendarPicker';
import CustomAlertModal from '../../components/ui/CustomAlertModal';
import PlaceDetailModal from '../../components/ui/PlaceDetailModal';
import { useBackHandler } from '../../hooks/useBackHandler';

export default function CalendarPage() {
  const { user } = useAuth();
  const { hasActiveJourney, setHasActiveJourney, setItineraryData, itineraryData, setSelectedCity } = useAi();

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

  // 클릭한 장소 상세 정보 상태
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // 숙소 관련 상태
  const [showAccommodationSearch, setShowAccommodationSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyToRemaining, setApplyToRemaining] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 모바일 뒤로가기 동기화 훅
  const { safeClose: closePlaceDetail } = useBackHandler(!!selectedPlace, () => setSelectedPlace(null), 'cal_place');
  const { safeClose: closePicker } = useBackHandler(showPicker, () => setShowPicker(false), 'cal_picker');
  const { safeClose: closeShare } = useBackHandler(showShareModal, () => setShowShareModal(false), 'cal_share');
  const { safeClose: closeAccSearch } = useBackHandler(showAccommodationSearch, () => {
    setShowAccommodationSearch(false);
    setSearchQuery('');
  }, 'cal_acc');
  const { safeClose: closeDelete } = useBackHandler(showDeleteModal, () => setShowDeleteModal(false), 'cal_delete');
  const { safeClose: closeAlert } = useBackHandler(alertOpen, () => setAlertOpen(false), 'cal_alert');

  const CITY_CENTERS: Record<string, { lat: number, lng: number }> = {
    '서울': { lat: 37.5665, lng: 126.9780 },
    '제주도': { lat: 33.4996, lng: 126.5312 },
    '부산': { lat: 35.1796, lng: 129.0756 },
    '속초': { lat: 38.2070, lng: 128.5918 },
    '도쿄': { lat: 35.6812, lng: 139.7671 },
    '오사카': { lat: 34.7024, lng: 135.4959 },
    '교토': { lat: 34.9858, lng: 135.7588 },
    '후쿠오카': { lat: 33.5902, lng: 130.4017 },
    '오키나와': { lat: 26.2124, lng: 127.6809 },
    '파리': { lat: 48.8566, lng: 2.3522 },
    '바르셀로나': { lat: 41.3851, lng: 2.1734 },
    '로마': { lat: 41.9028, lng: 12.4964 },
    '베를린': { lat: 52.5200, lng: 13.4050 },
  };

  const RECOMMENDED_HOTELS: Record<string, Array<{ name: string, address: string, lat: number, lng: number }>> = {
    '서울': [
      { name: '시그니엘 서울', address: '서울특별시 송파구 올림픽로 300', lat: 37.5125, lng: 127.1025 },
      { name: '신라호텔 서울', address: '서울특별시 중구 동호로 249', lat: 37.5562, lng: 127.0068 },
      { name: '포시즌스 호텔 서울', address: '서울특별시 종로구 새문안로 97', lat: 37.5704, lng: 126.9753 }
    ],
    '제주도': [
      { name: '제주 신라호텔', address: '제주특별자치도 서귀포시 중문관광로72번길 75', lat: 33.2475, lng: 126.4124 },
      { name: '롯데호텔 제주', address: '제주특별자치도 서귀포시 중문관광로72번길 35', lat: 33.2484, lng: 126.4105 },
      { name: '그랜드 하얏트 제주', address: '제주특별자치도 제주시 노연로 12', lat: 33.4851, lng: 126.4816 }
    ],
    '부산': [
      { name: '아난티 앳 부산 코브', address: '부산광역시 기장군 기장읍 기장해안로 268-32', lat: 35.1975, lng: 129.2312 },
      { name: '시그니엘 부산', address: '부산광역시 해운대구 달맞이길 30', lat: 35.1598, lng: 129.1672 },
      { name: '파크 하얏트 부산', address: '부산광역시 해운대구 마린시티1로 51', lat: 35.1558, lng: 129.1350 }
    ],
    '도쿄': [
      { name: '도쿄 스테이션 호텔', address: '1 Chome-9-1 Marunouchi, Chiyoda City, Tokyo', lat: 35.6815, lng: 139.7661 },
      { name: '아만 도쿄', address: '1 Chome-5-6 Otemachi, Chiyoda City, Tokyo', lat: 35.6865, lng: 139.7630 },
      { name: '파크 하얏트 도쿄', address: '3 Chome-7-1-2 Nishishinjuku, Shinjuku City, Tokyo', lat: 35.6856, lng: 139.6910 }
    ],
  };

  const getHotelsForCity = (city: string) => {
    const normCity = city ? city.replace(' 특별자치도', '').replace('도', '').trim() : '';
    let matchedKey = '제주도';
    if (normCity.includes('서울')) matchedKey = '서울';
    else if (normCity.includes('제주')) matchedKey = '제주도';
    else if (normCity.includes('부산')) matchedKey = '부산';
    else if (normCity.includes('도쿄')) matchedKey = '도쿄';
    else matchedKey = Object.keys(CITY_CENTERS).find(k => normCity.includes(k) || k.includes(normCity)) || '제주도';

    if (RECOMMENDED_HOTELS[matchedKey]) return RECOMMENDED_HOTELS[matchedKey];
    const center = CITY_CENTERS[matchedKey] || { lat: 33.4996, lng: 126.5312 };
    return [
      { name: `${city || '선택'} 센트럴 호텔`, address: `${city || '선택'} 중심가 메인 스트리트 10`, lat: center.lat + 0.002, lng: center.lng - 0.002 },
      { name: `${city || '선택'} 그랜드 팰리스`, address: `${city || '선택'} 해안 광장대로 55`, lat: center.lat - 0.003, lng: center.lng + 0.003 },
      { name: `${city || '선택'} 리버사이드 게스트하우스`, address: `${city || '선택'} 강변길 124`, lat: center.lat + 0.001, lng: center.lng + 0.004 }
    ];
  };

  const handleAddAccommodation = async (hotel: { name: string, address: string, lat: number, lng: number }) => {
    if (!activeSchedule) return;

    try {
      const clonedItinerary = JSON.parse(JSON.stringify(activeSchedule.itineraryData));
      const days = clonedItinerary.itinerary || [];

      if (applyToRemaining) {
        for (let i = activeDay - 1; i < days.length; i++) {
          days[i].accommodation = hotel;
        }
      } else {
        const dayObj = days.find((d: any) => d.day === activeDay);
        if (dayObj) {
          dayObj.accommodation = hotel;
        }
      }

      const res = await fetch('/api/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeSchedule.id,
          itineraryData: clonedItinerary
        })
      });

      const result = await res.json();
      if (result.success) {
        setActiveSchedule(result.data);
        setItineraryData(clonedItinerary);
        setShowAccommodationSearch(false);
        setSearchQuery('');
        
        setAlertTitle("숙소 추가 완료 ✨");
        setAlertMsg(`${hotel.name}이(가) 일정에 성공적으로 추가되었습니다.`);
        setAlertOpen(true);
      } else {
        alert("숙소 추가에 실패했습니다: " + result.message);
      }
    } catch (error) {
      console.error("Failed to add accommodation:", error);
      alert("서버 연결에 실패했습니다.");
    }
  };

  const handleSelectCustomAccommodation = (name: string) => {
    const city = activeSchedule?.city || "제주도";
    const normCity = city ? city.replace(' 특별자치도', '').replace('도', '').trim() : '';
    let matchedKey = '제주도';
    if (normCity.includes('서울')) matchedKey = '서울';
    else if (normCity.includes('제주')) matchedKey = '제주도';
    else if (normCity.includes('부산')) matchedKey = '부산';
    else if (normCity.includes('도쿄')) matchedKey = '도쿄';
    else matchedKey = Object.keys(CITY_CENTERS).find(k => normCity.includes(k) || k.includes(normCity)) || '제주도';

    const center = CITY_CENTERS[matchedKey] || { lat: 33.4996, lng: 126.5312 };
    const lat = center.lat + (Math.random() - 0.5) * 0.01;
    const lng = center.lng + (Math.random() - 0.5) * 0.01;
    handleAddAccommodation({
      name,
      address: `${city} 내 커스텀 등록지`,
      lat,
      lng
    });
  };

  const handleDeleteAccommodation = async (deleteAllRemaining: boolean) => {
    if (!activeSchedule) return;

    try {
      const clonedItinerary = JSON.parse(JSON.stringify(activeSchedule.itineraryData));
      const days = clonedItinerary.itinerary || [];
      const currentHotelName = days.find((d: any) => d.day === activeDay)?.accommodation?.name;

      if (deleteAllRemaining) {
        for (let i = activeDay - 1; i < days.length; i++) {
          if (!currentHotelName || days[i].accommodation?.name === currentHotelName) {
            delete days[i].accommodation;
          }
        }
      } else {
        const dayObj = days.find((d: any) => d.day === activeDay);
        if (dayObj) {
          delete dayObj.accommodation;
        }
      }

      const res = await fetch('/api/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeSchedule.id,
          itineraryData: clonedItinerary
        })
      });

      const result = await res.json();
      if (result.success) {
        setActiveSchedule(result.data);
        setItineraryData(clonedItinerary);
        setShowDeleteModal(false);

        setAlertTitle("숙소 삭제 완료 🗑️");
        setAlertMsg("선택한 숙소가 일정에서 삭제되었습니다.");
        setAlertOpen(true);
      } else {
        alert("숙소 삭제에 실패했습니다: " + result.message);
      }
    } catch (error) {
      console.error("Failed to delete accommodation:", error);
      alert("서버 연결에 실패했습니다.");
    }
  };

  // 장소 클릭 핸들러
  const handlePlaceClick = async (item: any) => {
    if (!item || !item.title) return;

    try {
      const res = await fetch(`/api/places?name=${encodeURIComponent(item.title)}`);
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        setSelectedPlace(result.data[0]);
      } else {
        // DB에 없을 경우 Fallback Place 객체 구성
        setSelectedPlace({
          id: -1,
          name: item.title,
          category: item.category || "관광지",
          description: item.description || `${item.title}에 대한 상세 정보가 준비 중입니다.`,
          address: item.location || "",
          imageUrl: "/images/placeholder.jpg",
          rating: 4.5,
          tags: [item.category || "명소", "AI 추천"],
          openingHours: item.suggested_time ? `${item.suggested_time} 이후` : "정보 없음",
          phoneNumber: "정보 없음",
          averagePrice: 0,
          destination: {
            name: activeSchedule?.city || "추천 도시"
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch place details:", error);
      setSelectedPlace({
        id: -1,
        name: item.title,
        category: item.category || "관광지",
        description: item.description || `${item.title}에 대한 상세 정보가 준비 중입니다.`,
        address: item.location || "",
        imageUrl: "/images/placeholder.jpg",
        rating: 4.5,
        tags: [item.category || "명소", "AI 추천"],
        openingHours: item.suggested_time ? `${item.suggested_time} 이후` : "정보 없음",
        phoneNumber: "정보 없음",
        averagePrice: 0,
        destination: {
          name: activeSchedule?.city || "추천 도시"
        }
      });
    }
  };

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
        setSelectedCity(latest.city);
        setHasActiveJourney(true);
      } else {
        // DB에 일정이 없으면 빈 상태로 설정 및 Context 리셋
        setActiveSchedule(null);
        setItineraryData(null);
        setHasActiveJourney(false);
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
  const prevDayData = rawItinerary.find((d: any) => d.day === activeDay - 1);
  const prevAccommodation = prevDayData?.accommodation;
  const currentAccommodation = currentDayData?.accommodation;

  return (
    <>
      <div className="calendar-content">
        {!activeSchedule ? (
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

            {/* 실시간 경로 지도 보기 버튼 */}
            <Link href="/?trigger=map" style={{ textDecoration: 'none', width: '100%' }}>
              <button
                className="calendar-map-btn"
                style={{ marginTop: '16px' }}
              >
                <Navigation size={18} fill="white" />
                실시간 경로 지도 보기
              </button>
            </Link>

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
              {/* Day N 아침 숙소 출발 노드 */}
              {activeDay > 1 && prevAccommodation && (
                <div className="timeline-item" style={{ marginBottom: '20px' }}>
                  <div className="timeline-point-outer" style={{ borderColor: '#8c52ff' }}>
                    <div className="timeline-point-inner" style={{ backgroundColor: '#8c52ff' }} />
                  </div>
                  <div className="timeline-time" style={{ fontWeight: 700, color: '#8c52ff' }}>
                    09:00
                  </div>
                  <div className="timeline-card" style={{ border: '1.5px solid #8c52ff', background: '#fcfaff' }}>
                    <div className="timeline-card-icon" style={{ backgroundColor: '#f3eeff' }}>
                      🏠
                    </div>
                    <div className="timeline-card-content">
                      <div className="timeline-card-header">
                        <h3 className="timeline-card-title" style={{ color: '#8c52ff', fontSize: '16px' }}>
                          {prevAccommodation.name} 출발
                        </h3>
                      </div>
                      <p className="timeline-card-desc" style={{ marginBottom: 0 }}>
                        {prevAccommodation.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                    <div 
                      className="timeline-card" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePlaceClick(item)}
                    >
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

              {/* Day N 밤 숙소 입실 노드 */}
              {currentAccommodation ? (
                <div className="timeline-item" style={{ marginTop: '20px' }}>
                  <div className="timeline-point-outer" style={{ borderColor: '#8c52ff' }}>
                    <div className="timeline-point-inner" style={{ backgroundColor: '#8c52ff' }} />
                  </div>
                  <div className="timeline-time" style={{ fontWeight: 700, color: '#8c52ff' }}>
                    20:00
                  </div>
                  <div className="timeline-card" style={{ border: '1.5px dashed #8c52ff', background: '#fcfaff' }}>
                    <div className="timeline-card-icon" style={{ backgroundColor: '#f3eeff' }}>
                      🏨
                    </div>
                    <div className="timeline-card-content">
                      <div className="timeline-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="timeline-card-title" style={{ color: '#8c52ff', fontSize: '16px' }}>
                          {currentAccommodation.name} 입실
                        </h3>
                        <button 
                          onClick={() => setShowDeleteModal(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff4757',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                      <p className="timeline-card-desc" style={{ marginBottom: 0 }}>
                        {currentAccommodation.address}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="timeline-item" style={{ marginTop: '20px' }}>
                  <div className="timeline-point-outer" style={{ borderColor: '#cbd5e1' }}>
                    <div className="timeline-point-inner" style={{ backgroundColor: '#cbd5e1' }} />
                  </div>
                  <div className="timeline-time" style={{ fontWeight: 700, color: '#94a3b8' }}>
                    🏨
                  </div>
                  <div 
                    className="timeline-card" 
                    style={{ border: '2px dashed #cbd5e1', cursor: 'pointer', background: '#fafbfc', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 24px' }}
                    onClick={() => setShowAccommodationSearch(true)}
                  >
                    <span style={{ color: '#64748b', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={16} /> 오늘 머물 숙소 추가하기
                    </span>
                  </div>
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
            onCancel={closePicker} 
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
                onClick={closeShare}
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

      {/* 숙소 추가 검색 모달 */}
      {showAccommodationSearch && (
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
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
              {activeDay}일차 숙소 추가
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', textAlign: 'center' }}>
              머무시는 숙소를 검색하거나 추천 숙소에서 선택해 주세요.
            </p>

            {/* 검색창 */}
            <input
              type="text"
              placeholder="숙소 이름 또는 주소 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '16px'
              }}
            />

            {/* 리스트 영역 */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {searchQuery.trim().length > 0 && (
                <div 
                  onClick={() => handleSelectCustomAccommodation(searchQuery)}
                  style={{
                    padding: '12px',
                    borderRadius: '16px',
                    border: '1.5px solid #8c52ff',
                    backgroundColor: '#f9f6ff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#8c52ff' }}>🔍 "{searchQuery}" 입력대로 추가</div>
                  <div style={{ fontSize: '11px', color: '#8c52ff', marginTop: '2px' }}>임시 커스텀 숙소로 등록합니다.</div>
                </div>
              )}

              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', margin: '4px 0' }}>추천 숙소</div>
              {getHotelsForCity(activeSchedule?.city)
                .filter(hotel => hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) || hotel.address.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((hotel, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAddAccommodation(hotel)}
                    style={{
                      padding: '12px',
                      borderRadius: '16px',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      backgroundColor: '#ffffff'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8c52ff'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{hotel.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{hotel.address}</div>
                  </div>
                ))}
            </div>

            {/* 연박 설정 체크박스 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px', padding: '0 4px' }}>
              <input 
                type="checkbox" 
                checked={applyToRemaining} 
                onChange={(e) => setApplyToRemaining(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: '#8c52ff' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                남은 모든 일정에 이 숙소 등록 (연박)
              </span>
            </label>

            {/* 하단 버튼 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={closeAccSearch}
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
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 숙소 삭제 확인 모달 */}
      {showDeleteModal && (
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
            maxWidth: '340px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>
              숙소 삭제 설정
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
              등록된 숙소를 어떻게 삭제할까요?<br />
              연박으로 등록된 경우 일괄 삭제할 수 있습니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleDeleteAccommodation(true)}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#ff5252',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                이후 모든 일정에서 삭제 (일괄 삭제)
              </button>
              <button
                onClick={() => handleDeleteAccommodation(false)}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {activeDay}일차 숙소만 삭제
              </button>
              <button
                onClick={closeDelete}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                취소
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
        onConfirm={closeAlert}
      />

      {/* 플로팅 버튼 */}
      <button 
        className="calendar-fab"
        onClick={() => setShowPicker(true)}
      >
        <Plus size={32} strokeWidth={1.5} />
      </button>

      {/* 상세 정보 모달 */}
      <PlaceDetailModal 
        place={selectedPlace} 
        onClose={closePlaceDetail} 
      />
    </>
  );
}