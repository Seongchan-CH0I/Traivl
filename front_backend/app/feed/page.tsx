"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAi } from '../../context/AiContext';
import { Home, LayoutGrid, Sparkles, Calendar, User, Plane, Flame, Star, Lightbulb, PartyPopper, X, Plus } from 'lucide-react';

const TravelApp = () => {
  const { hasActiveJourney, selectedCity } = useAi();
  const [activeTab, setActiveTab] = useState('전체');
  const [showMyDestination, setShowMyDestination] = useState(false);

  const guides = [
    { id: 1, title: "기요미즈데라(청수사)", desc: "고즈넉한 사찰에서의 힐링 산책", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800", badge: "여유로움", category: "인기", city: "교토", type: "journey" },
    { id: 2, title: "니시키 시장 맛집", desc: "현지인들도 찾는 교토의 부엌", img: "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=800", rating: "4.8", category: "리뷰", city: "교토", type: "journey" },
    { id: 3, title: "교토 버스 원데이 패스", desc: "교토 시내 여행의 필수 아이템", img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800", category: "팁", city: "교토", type: "journey" },
    { id: 4, title: "경복궁", desc: "지금 방문하면 한복 대여 할인이 있어요", img: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?q=80&w=800", badge: "여유로움", category: "인기", city: "서울", type: "general" },
    { id: 5, title: "명동교자", desc: "진한 칼국수 국물이 정말 일품이에요", img: "http://m.mdkj.co.kr/img/store01.jpg", rating: "4.5", category: "리뷰", city: "서울", type: "general" },
    { id: 6, title: "한강 공원", desc: "반포한강공원 무지개분수", img: "/images/KR_SEOUL.jpg", rating: "4.5", category: "이벤트", city: "서울", type: "general" }
  ];

  const filteredGuides = guides.filter(guide => {
    if (activeTab === '전체') return true;
    return guide.category === activeTab;
  });

  const tabs = [
    { id: '전체', icon: <span className="gradient-icon" style={{ fontSize: '13px' }}>🌐</span>, label: "전체" },
    { id: '인기', icon: <Flame size={13} style={{ color: '#ff5722' }} />, label: "인기" },
    { id: '리뷰', icon: <Star size={13} style={{ color: '#ffc107', fill: '#ffc107' }} />, label: "리뷰" },
    { id: '팁', icon: <Lightbulb size={13} style={{ color: '#ff9800' }} />, label: "팁" },
    { id: '이벤트', icon: <PartyPopper size={13} style={{ color: '#2196f3' }} />, label: "이벤트" }
  ];

  return (
    <>
      {/* --- Header --- */}
      <header className="feed-header">
        <h1 className="feed-header-title">여행 실시간 가이드</h1>
        <div 
          className={`location-badge ${showMyDestination ? 'active' : ''}`}
          onClick={() => setShowMyDestination(!showMyDestination)}
          style={{ cursor: 'pointer' }}
        >
          <span className="location-text">{showMyDestination && selectedCity ? selectedCity : '내 여행지'}</span>
          <Plane size={12} className="location-icon" />
          {showMyDestination && <X size={14} className="location-close" />}
        </div>
      </header>

      {/* --- Filter Tabs --- */}
      <div className="feed-filter-scroll">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            className={`guide-filter-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} <span style={{ marginLeft: '4px' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* --- Main Content (Cards) --- */}
      <main className="content feed-main">
        {showMyDestination && !hasActiveJourney ? (
          <div className="empty-journey-container">
            <div className="empty-journey-icon-wrapper">
              <div className="plane-illustration-box" style={{ overflow: 'visible' }}>
                <div className="icon-glow-effect"></div>
                <span className="plane-takeoff-icon">🛫</span>
                <div className="purple-path"></div>
              </div>
            </div>
            
            <h2 className="empty-journey-title">
              내 여행지를<br />선택하지 않았습니다
            </h2>
            
            <p className="empty-journey-subtitle">
              어디로 떠나고 싶으신가요?<br />
              가고자 하는 설레는 여행지를 골라주세요.
            </p>

            <Link href="/?trigger=survey" style={{ textDecoration: 'none' }}>
              <button className="select-destination-btn">
                여행지 선택하기 <Plus size={18} />
              </button>
            </Link>
          </div>
        ) : (
          filteredGuides
            .filter(item => {
              const guideType = (item as any).type;
              const itemCity = (item as any).city;

              if (showMyDestination) {
                // '내 여행지' 탭: 활성화된 여행지가 있다면 해당 도시 정보만 표시
                // 여행지 관련 정보(type: journey)만 노출
                return guideType === "journey" && hasActiveJourney && selectedCity && itemCity === selectedCity;
              } else {
                // '일반 피드': 일반 정보(type: general)만 노출 (교토 등 여행지 정보 완전 배제)
                return guideType === "general";
              }
            })
            .map((item) => (
              <div key={item.id} className="feed-card">
                <img src={item.img} alt={item.title} className="feed-img" />
                <div className="feed-overlay" />
                
                <div className="feed-badge-top-left">
                  {item.badge && (
                    <div className="feed-status-badge">
                      <span className="dot" /> {item.badge}
                    </div>
                  )}
                </div>
                {item.rating && (
                  <div className="feed-rating-badge">
                    <Star size={10} style={{ fill: '#fbbf24', color: '#fbbf24' }} /> {item.rating}
                  </div>
                )}

                <div className="feed-card-info">
                  <h2 className="feed-card-title">{item.title}</h2>
                  <p className="feed-card-desc">
                    {item.id === 3 && <span style={{ marginRight: '4px' }}>⏱️</span>}
                    {item.desc}
                  </p>
                </div>
              </div>
            ))
        )}
      </main>

      {/* --- Bottom Navigation --- (layout.tsx에서 담당하므로 여기서는 실제 렌더링 안 함. 
          feed 폴더에 임시로 넣었던 하단 내비게이션은 globals.css의 체계를 따르는 레이아웃으로 이관) */}
    </>
  );
};

export default TravelApp;