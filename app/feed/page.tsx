"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, LayoutGrid, Sparkles, Calendar, User, Plane, Flame, Star, Lightbulb, PartyPopper, X } from 'lucide-react';

const TravelApp = () => {
  const [activeTab, setActiveTab] = useState('전체');

  const guides = [
    { id: 1, title: "경복궁", desc: "지금 방문하면 한복 대여 할인이 있어요", img: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?q=80&w=800", badge: "여유로움", category: "인기" },
    { id: 2, title: "명동교자", desc: "진한 칼국수 국물이 정말 일품이에요", img: "https://images.unsplash.com/photo-1534422298391-e4f8c170db06?q=80&w=800", rating: "4.5", category: "리뷰" },
    { id: 3, title: "대중교통 환승 팁", desc: "기후동행카드 사용 가능", img: "https://images.unsplash.com/photo-1517604931442-7e0c8ed0963c?q=80&w=800", category: "팁" },
    { id: 4, title: "한강 공원", desc: "반포한강공원 무지개분수", img: "https://images.unsplash.com/photo-1540914124281-3427106e74f9?q=80&w=800", rating: "4.5", category: "이벤트" }
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
        <Link href="/guide" style={{ textDecoration: 'none' }}>
          <div className="location-badge">
            <span className="location-text">내 여행지</span>
            <Plane size={12} className="location-icon" />
            <X size={14} className="location-close" />
          </div>
        </Link>
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
        {filteredGuides.map((item) => (
          <div key={item.id} className="feed-card">
            <img src={item.img} alt={item.title} className="feed-img" />
            <div className="feed-overlay" />
            
            {/* Badges */}
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

            {/* Bottom Text Info */}
            <div className="feed-card-info">
              <h2 className="feed-card-title">{item.title}</h2>
              <p className="feed-card-desc">
                {item.id === 3 && <span style={{ marginRight: '4px' }}>⏱️</span>}
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </main>

      {/* --- Bottom Navigation --- (layout.tsx에서 담당하므로 여기서는 실제 렌더링 안 함. 
          feed 폴더에 임시로 넣었던 하단 내비게이션은 globals.css의 체계를 따르는 레이아웃으로 이관) */}
    </>
  );
};

export default TravelApp;