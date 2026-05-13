"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAi } from '../../context/AiContext';
import { Plane, Flame, Star, Lightbulb, PartyPopper, X, Plus, Loader2 } from 'lucide-react';

interface GuideItem {
    id: string;
    title: string;
    desc: string;
    img: string;
    badge: string;
    rating?: string;
    category: string;
    city: string;
    destinationId: string;
    rank: number;
}

const TravelApp = () => {
    const { hasActiveJourney, selectedCity } = useAi();
    const [activeTab, setActiveTab] = useState('전체');
    const [showMyDestination, setShowMyDestination] = useState(false);
    const [guides, setGuides] = useState<GuideItem[]>([]);
    const [loading, setLoading] = useState(true);

    // DB 데이터를 카테고리별로 분류하는 로직
    const categorizePlace = (name: string, description: string) => {
        const text = (name + (description || '')).toLowerCase();
        if (text.includes('맛집') || text.includes('카페') || text.includes('레스토랑') || text.includes('음식') || text.includes('국물') || text.includes('먹거리')) return '리뷰';
        if (text.includes('팁') || text.includes('패스') || text.includes('교통') || text.includes('방법') || text.includes('할인') || text.includes('이용권') || text.includes('가이드')) return '팁';
        if (text.includes('축제') || text.includes('행사') || text.includes('이벤트') || text.includes('시즌') || text.includes('개막') || text.includes('분수') || text.includes('공연') || text.includes('전시') || text.includes('마켓') || text.includes('벚꽃') || text.includes('불꽃') || text.includes('단풍') || text.includes('팝업') || text.includes('야간')) return '이벤트';
        return '인기';
    };

    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/places');
                const result = await response.json();
                
                if (result.success) {
                    const mappedData = result.data.map((place: any) => ({
                        id: place.id.toString(),
                        title: place.name,
                        desc: place.description,
                        img: place.imageUrl || '/images/placeholder.jpg',
                        badge: place.category || '명소',
                        rating: place.rating ? place.rating.toFixed(1) : (4.0 + Math.random() * 1.0).toFixed(1),
                        category: categorizePlace(place.name, place.description),
                        city: place.destination?.name.split(',')[0].trim() || '',
                        destinationId: place.destinationId,
                        rank: place.rank
                    }));
                    setGuides(mappedData);
                }
            } catch (error) {
                console.error("Failed to fetch places:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaces();
    }, []);

    // 필터링 및 데이터 구성 로직
    const getDisplayGuides = () => {
        // 1. 내 여행지 필터링 (활성화된 경우)
        let baseItems = guides;
        if (showMyDestination && selectedCity) {
            baseItems = guides.filter(g => g.city.includes(selectedCity));
        }

        if (activeTab === '전체') {
            // '전체' 탭: 각 카테고리별 리스트를 먼저 추출 (최대 3개씩)
            const categories = ['인기', '리뷰', '팁', '이벤트'];
            const groupedItems = categories.map(cat => 
                baseItems.filter(item => item.category === cat).slice(0, 3)
            );
            
            let interleaved: GuideItem[] = [];
            // 0, 1, 2 인덱스를 돌며 각 카테고리의 아이템을 하나씩 번갈아가며 추가
            for (let i = 0; i < 3; i++) {
                groupedItems.forEach(list => {
                    if (list[i]) interleaved.push(list[i]);
                });
            }
            
            return interleaved;
        } else {
            // 특정 카테고리 탭: 해당 카테고리만 필터링
            const filtered = baseItems.filter(item => item.category === activeTab);
            // 내 여행지가 아닐 때만 갯수 제한 (Top 12), 내 여행지 모드면 해당 도시 정보를 다 보여줌
            return showMyDestination ? filtered : filtered.slice(0, 12);
        }
    };

    const displayGuides = getDisplayGuides();

    const tabs = [
        { id: '전체', icon: <span className="gradient-icon" style={{ fontSize: '13px' }}>🌐</span>, label: "전체" },
        { id: '인기', icon: <Flame size={13} style={{ color: '#ff5722' }} />, label: "인기" },
        { id: '리뷰', icon: <Star size={13} style={{ color: '#ffc107', fill: '#ffc107' }} />, label: "리뷰" },
        { id: '팁', icon: <Lightbulb size={13} style={{ color: '#ff9800' }} />, label: "팁" },
        { id: '이벤트', icon: <PartyPopper size={13} style={{ color: '#2196f3' }} />, label: "이벤트" }
    ];

    return (
        <>
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

            <main className="content feed-main">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p>가이드를 불러오는 중...</p>
                    </div>
                ) : showMyDestination && (!hasActiveJourney || !selectedCity) ? (
                    <div className="empty-journey-container">
                        <div className="empty-journey-icon-wrapper">
                            <div className="plane-illustration-box" style={{ overflow: 'visible' }}>
                                <div className="icon-glow-effect"></div>
                                <span className="plane-takeoff-icon">🛫</span>
                                <div className="purple-path"></div>
                            </div>
                        </div>
                        <h2 className="empty-journey-title">내 여행지를<br />선택하지 않았습니다</h2>
                        <p className="empty-journey-subtitle">어디로 떠나고 싶으신가요?<br />가고자 하는 설레는 여행지를 골라주세요.</p>
                        <Link href="/?trigger=survey" style={{ textDecoration: 'none' }}>
                            <button className="select-destination-btn">여행지 선택하기 <Plus size={18} /></button>
                        </Link>
                    </div>
                ) : displayGuides.length === 0 ? (
                    <div className="empty-state py-20 text-center">
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <p className="text-gray-500">해당하는 가이드 정보가 없습니다.</p>
                    </div>
                ) : (
                    displayGuides.map((item) => (
                        <div key={item.id} className="feed-card">
                            <img src={item.img} alt={item.title} className="feed-img" />
                            <div className="feed-overlay" />
                            <div className="feed-badge-top-left">
                                <div className="feed-status-badge">
                                    <span className="dot" /> {item.city} • {item.badge}
                                </div>
                            </div>
                            {item.rating && (
                                <div className="feed-rating-badge">
                                    <Star size={10} style={{ fill: '#fbbf24', color: '#fbbf24' }} /> {item.rating}
                                </div>
                            )}
                            <div className="feed-card-info">
                                <div className="flex items-center gap-2 mb-1">
                                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>
                                        {item.category}
                                    </span>
                                </div>
                                <h2 className="feed-card-title">{item.title}</h2>
                                <p className="feed-card-desc">{item.desc}</p>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </>
    );
};

export default TravelApp;