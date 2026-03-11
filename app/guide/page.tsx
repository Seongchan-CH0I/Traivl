"use client";

import React, { useState } from 'react';
import { Flame, Star, Lightbulb, PartyPopper, AlertCircle, Clock } from 'lucide-react';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState('전체');

  const guides = [
    {
      id: 1,
      title: "아라시야마 대나무숲",
      desc: "지금 방문하면 인파가 많아요",
      img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",
      alert: "매우 혼잡",
      alertIcon: <AlertCircle size={14} color="#ef4444" />,
      category: "인기" // 인기 카테고리 매칭용
    },
    {
      id: 2,
      title: "이치란 라멘",
      desc: "돈코츠 국물이 진하고 맛있어요",
      img: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=800",
      rating: 5,
      category: "리뷰" // 리뷰 카테고리 매칭용
    },
    {
      id: 3,
      title: "교토 버스 탑승 팁",
      desc: "뒷문으로 타서 앞으로 내립니다",
      img: "https://images.unsplash.com/photo-1624233519844-315185df23fe?q=80&w=800",
      isTip: true,
      category: "팁", // 팁 카테고리 매칭용
      footer: (
        <>
          <Clock size={12} /> QR결제 가능
        </>
      )
    }
  ];

  // 클릭한 탭의 라벨에 맞는 데이터만 필터링하는 로직
  const filteredGuides = guides.filter(guide => {
    if (activeTab === '전체') return true;
    return guide.category === activeTab;
  });

  const tabs = [
    { id: '전체', icon: <span className="gradient-icon">🌐</span>, label: "전체" },
    { id: '인기', icon: <Flame size={14} style={{ color: '#ff5722' }} />, label: "인기" },
    { id: '리뷰', icon: <Star size={14} style={{ color: '#ffc107', fill: '#ffc107' }} />, label: "리뷰" },
    { id: '팁', icon: <Lightbulb size={14} style={{ color: '#ff9800' }} />, label: "팁" },
    { id: '이벤트', icon: <PartyPopper size={14} style={{ color: '#2196f3' }} />, label: "이벤트" }
  ];

  return (
    <>
      {/* Header */}
      <div className="guide-header">
        <h1>kyoto 실시간 가이드</h1>
        <p>DNA 맞춤 정보</p>
      </div>

      {/* Filter Tabs */}
      <div className="feed-filter-scroll" style={{ paddingBottom: '20px' }}>
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

      {/* Masonry Content */}
      <div className="guide-masonry">
        {filteredGuides.map((item) => (
          <div key={item.id} className="guide-card">
            <div className="guide-card-img-wrapper">
              <img src={item.img} alt={item.title} className="guide-card-img" />
              
              {/* Top Left Badge */}
              {item.alert && (
                <div className="guide-card-badge-top-left">
                  <span className="dot bg-red-500"></span> {item.alert}
                </div>
              )}

              {/* Top Right Icon */}
              {item.alertIcon && (
                <div className="guide-card-icon-top-right">
                  {item.alertIcon}
                </div>
              )}
              {item.rating && (
                <div className="guide-card-icon-top-right">
                  <Star size={14} style={{ color: '#ffc107', fill: '#ffc107' }} />
                </div>
              )}
              {item.isTip && (
                <div className="guide-card-icon-top-right" style={{ backgroundColor: '#eff6ff' }}>
                  <Lightbulb size={14} style={{ color: '#3b82f6', fill: '#3b82f6' }} />
                </div>
              )}
            </div>
            
            <div className="guide-card-content">
              <h3 className="guide-card-title">{item.title}</h3>
              <p className="guide-card-desc">{item.desc}</p>
              
              {/* Footer details like stars or extra info */}
              {item.rating && (
                <div className="guide-card-stars">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={10} style={{ color: '#ffc107', fill: '#ffc107' }} />
                  ))}
                </div>
              )}
              {item.footer && (
                <div className="guide-card-footer">
                  {item.footer}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
