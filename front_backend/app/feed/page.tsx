"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAi } from '../../context/AiContext';
import { useAuth } from '../../hooks/useAuth';
import { Plane, Flame, Star, Lightbulb, PartyPopper, X, Plus, Loader2, ArrowRight, Download } from 'lucide-react';
import PlaceDetailModal from '../../components/ui/PlaceDetailModal';
import CustomAlertModal from '../../components/ui/CustomAlertModal';
import { Place } from '../../types/place';

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
    rawPlace?: Place;
}

export default function FeedPage() {
    const { user } = useAuth();
    const { hasActiveJourney, selectedCity } = useAi();

    // 메인 피드 모드: 'guide' (실시간 가이드) | 'recommend' (유저 추천 코스)
    const [feedMode, setFeedMode] = useState<'guide' | 'recommend'>('guide');

    // 가이드 상태
    const [activeTab, setActiveTab] = useState('전체');
    const [showMyDestination, setShowMyDestination] = useState(false);
    const [guides, setGuides] = useState<GuideItem[]>([]);
    const [guidesLoading, setGuidesLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    // 공유 피드 상태 (추천 코스)
    const [sharedSchedules, setSharedSchedules] = useState<any[]>([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [copyingId, setCopyingId] = useState<string | null>(null);

    // Alert 모달 상태
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMsg, setAlertMsg] = useState('');

    // DB 플레이스 카테고리별로 분류하는 로직
    const categorizePlace = (name: string, description: string) => {
        const text = (name + (description || '')).toLowerCase();
        if (text.includes('맛집') || text.includes('카페') || text.includes('레스토랑') || text.includes('음식') || text.includes('디저트') || text.includes('먹거리')) return '리뷰';
        if (text.includes('팁') || text.includes('코스') || text.includes('교통') || text.includes('방법') || text.includes('할인') || text.includes('이용료') || text.includes('가이드')) return '팁';
        if (text.includes('축제') || text.includes('행사') || text.includes('이벤트') || text.includes('시즌') || text.includes('개막') || text.includes('분수') || text.includes('공연') || text.includes('전시') || text.includes('마켓') || text.includes('벚꽃') || text.includes('불꽃') || text.includes('단풍') || text.includes('팝업') || text.includes('야간')) return '이벤트';
        return '인기';
    };

    // 1. 맛집/명소 가이드 불러오기
    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                setGuidesLoading(true);
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
                        rank: place.rank,
                        rawPlace: place
                    }));
                    setGuides(mappedData);
                }
            } catch (error) {
                console.error("Failed to fetch places:", error);
            } finally {
                setGuidesLoading(false);
            }
        };

        fetchPlaces();
    }, []);

    // 2. 유저 추천 공유 코스 불러오기
    const fetchSharedSchedules = async () => {
        setSchedulesLoading(true);
        try {
            const response = await fetch('/api/feed/schedules');
            const result = await response.json();
            if (result.success) {
                setSharedSchedules(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch shared schedules:", error);
        } finally {
            setSchedulesLoading(false);
        }
    };

    useEffect(() => {
        if (feedMode === 'recommend') {
            fetchSharedSchedules();
        }
    }, [feedMode]);

    // 3. 일정 복제(Deep Copy) 함수
    const handleCopySchedule = async (scheduleId: string, title: string) => {
        if (!user?.id) {
            setAlertTitle("로그인 필요 🔒");
            setAlertMsg("일정을 내 보관함으로 가져오려면 로그인이 필요합니다.");
            setAlertOpen(true);
            return;
        }

        setCopyingId(scheduleId);
        try {
            const response = await fetch('/api/feed/schedules/copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    scheduleId
                })
            });

            const result = await response.json();
            if (result.success) {
                setAlertTitle("일정 가져오기 완료 🎉");
                setAlertMsg(`'${title}' 일정이 내 일정 보관함에 성공적으로 복사되었습니다.\n\n마이페이지의 '내 일정 보관함' 탭에서 복사된 일정을 확인하고, '내 일정으로 설정'을 눌러 지도로 보실 수 있습니다.`);
                setAlertOpen(true);
            } else {
                alert("일정 복제에 실패했습니다: " + result.message);
            }
        } catch (error) {
            console.error("Failed to copy schedule:", error);
            alert("서버 연결에 실패했습니다.");
        } finally {
            setCopyingId(null);
        }
    };

    // 필터링 및 가이드 구성 로직
    const getDisplayGuides = () => {
        let baseItems = guides;
        if (showMyDestination && selectedCity) {
            baseItems = guides.filter(g => g.city.includes(selectedCity));
        }

        if (activeTab === '전체') {
            const categories = ['인기', '리뷰', '팁', '이벤트'];
            const groupedItems = categories.map(cat =>
                baseItems.filter(item => item.category === cat).slice(0, 3)
            );

            let interleaved: GuideItem[] = [];
            for (let i = 0; i < 3; i++) {
                groupedItems.forEach(list => {
                    if (list[i]) interleaved.push(list[i]);
                });
            }
            return interleaved;
        } else {
            const filtered = baseItems.filter(item => item.category === activeTab);
            return showMyDestination ? filtered : filtered.slice(0, 12);
        }
    };

    const displayGuides = getDisplayGuides();

    const tabs = [
        { id: '전체', icon: <span className="gradient-icon" style={{ fontSize: '13px' }}>✨</span>, label: "전체" },
        { id: '인기', icon: <Flame size={13} style={{ color: '#ff5722' }} />, label: "인기" },
        { id: '리뷰', icon: <Star size={13} style={{ color: '#ffc107', fill: '#ffc107' }} />, label: "리뷰" },
        { id: '팁', icon: <Lightbulb size={13} style={{ color: '#ff9800' }} />, label: "팁" },
        { id: '이벤트', icon: <PartyPopper size={13} style={{ color: '#2196f3' }} />, label: "이벤트" }
    ];

    return (
        <>
            {/* 상단 통합 헤더 */}
            <header className="feed-header" style={{ paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <h1 className="feed-header-title" style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                        여행 실시간 가이드
                    </h1>

                    {/* 내 여행지 필터 배지 */}
                    <div
                        className={`location-badge ${showMyDestination ? 'active' : ''}`}
                        onClick={() => {
                            if (feedMode === 'guide') {
                                setShowMyDestination(!showMyDestination);
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            backgroundColor: showMyDestination && feedMode === 'guide' ? '#e8dbff' : '#f1f5f9',
                            color: showMyDestination && feedMode === 'guide' ? '#8c52ff' : '#64748b',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: feedMode === 'guide' ? 'pointer' : 'default',
                            opacity: feedMode === 'guide' ? 1 : 0.6,
                            transition: 'all 0.2s',
                            userSelect: 'none'
                        }}
                    >
                        <span className="location-text">{showMyDestination && selectedCity ? selectedCity : '내 여행지'}</span>
                        <Plane size={12} className="location-icon" />
                        {showMyDestination && feedMode === 'guide' && <X size={14} className="location-close" style={{ marginLeft: '2px' }} />}
                    </div>

                    {/* ✨ 유저 추천 코스 토글 버튼 */}
                    <button
                        onClick={() => setFeedMode(feedMode === 'guide' ? 'recommend' : 'guide')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: feedMode === 'recommend' ? '1.5px solid #c084fc' : '1.5px solid #e2e8f0',
                            backgroundColor: feedMode === 'recommend' ? '#f3e8ff' : '#ffffff',
                            color: feedMode === 'recommend' ? '#8c52ff' : '#64748b',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: feedMode === 'recommend' ? '0 2px 8px rgba(140, 82, 255, 0.15)' : 'none'
                        }}
                    >
                        <span>✨</span>
                        <span>유저 추천 코스</span>
                    </button>
                </div>
            </header>

            {feedMode === 'guide' ? (
                <>
                    {/* 가이드 카테고리 필터 */}
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
                        {guidesLoading ? (
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
                                <h2 className="empty-journey-title">활성화된 여행 일정이<br />존재하지 않습니다</h2>
                                <p className="empty-journey-subtitle">내 일정 탭에서 여행을 계획하고<br />지도를 받아보세요.</p>
                                <Link href="/?trigger=survey" style={{ textDecoration: 'none' }}>
                                    <button className="select-destination-btn">일정 생성하기 <Plus size={18} /></button>
                                </Link>
                            </div>
                        ) : displayGuides.length === 0 ? (
                            <div className="empty-state py-20 text-center">
                                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                                <p className="text-gray-500">해당하는 명소나 팁이 없습니다.</p>
                            </div>
                        ) : (
                            displayGuides.map((item) => (
                                <div
                                    key={item.id}
                                    className="feed-card"
                                    onClick={() => item.rawPlace && setSelectedPlace(item.rawPlace)}
                                    style={{ cursor: 'pointer' }}
                                >
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
            ) : (
                <main className="content feed-main" style={{ padding: '20px 16px' }}>
                    {schedulesLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p>유저 추천 코스를 불러오는 중...</p>
                        </div>
                    ) : sharedSchedules.length === 0 ? (
                        <div className="empty-state py-20 text-center text-gray-500">
                            <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
                            <p>공유된 추천 코스가 아직 없습니다.</p>
                        </div>
                    ) : (
                        sharedSchedules.map((post) => {
                            const days = Array.isArray(post.itineraryData)
                                ? post.itineraryData
                                : (typeof post.itineraryData === 'string'
                                    ? JSON.parse(post.itineraryData)
                                    : []);

                            return (
                                <div
                                    key={post.id}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '24px',
                                        padding: '20px',
                                        marginBottom: '16px',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '14px'
                                    }}
                                >
                                    {/* 작성자 정보 */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img
                                                src={post.user?.profileImage || '/images/default-profile.png'}
                                                alt={post.user?.name}
                                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                                                        {post.user?.name || '익명'}
                                                    </span>
                                                    {post.user?.dnaType && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            backgroundColor: '#f3e8ff',
                                                            color: '#8c52ff',
                                                            padding: '2px 6px',
                                                            fontWeight: 700,
                                                            borderRadius: '6px'
                                                        }}>
                                                            🧬 {post.user.dnaType}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                    {new Date(post.updatedAt).toLocaleDateString()} 업로드
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 게시물 코멘트 */}
                                    {post.shareContent && (
                                        <p style={{
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            color: '#334155',
                                            fontWeight: 500,
                                            margin: 0,
                                            backgroundColor: '#f8fafc',
                                            padding: '12px 16px',
                                            borderRadius: '16px',
                                            borderLeft: '4px solid #8c52ff'
                                        }}>
                                            "{post.shareContent}"
                                        </p>
                                    )}

                                    {/* 추천 일정 카드 */}
                                    <div style={{
                                        borderRadius: '18px',
                                        border: '1.5px solid #f1f5f9',
                                        padding: '14px 16px',
                                        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                                {post.title}
                                            </h4>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#8c52ff' }}>
                                                📍 {post.city}
                                            </span>
                                        </div>

                                        {/* 경로 간략 타임라인 */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                            {days.slice(0, 2).map((dayObj: any) => (
                                                <div key={dayObj.day} style={{ display: 'flex', gap: '8px', fontSize: '12px', alignItems: 'flex-start' }}>
                                                    <span style={{ fontWeight: 800, color: '#475569', flexShrink: 0, width: '42px' }}>
                                                        {dayObj.day}일차:
                                                    </span>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                                                        {dayObj.places?.map((place: any, pIdx: number) => (
                                                            <React.Fragment key={pIdx}>
                                                                <span style={{ fontWeight: 600, color: '#334155' }}>{place.title}</span>
                                                                {pIdx < dayObj.places.length - 1 && <ArrowRight size={10} style={{ color: '#cbd5e1' }} />}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {days.length > 2 && (
                                                <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '50px' }}>
                                                    외 {days.length - 2}일 분량의 상세 코스가 더 있습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 가져오기 버튼 */}
                                    <button
                                        onClick={() => handleCopySchedule(post.id, post.title)}
                                        disabled={copyingId === post.id}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '16px',
                                            backgroundColor: '#8c52ff',
                                            color: '#ffffff',
                                            border: 'none',
                                            fontSize: '13.5px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 12px rgba(140, 82, 255, 0.15)',
                                            transition: 'all 0.2s',
                                            opacity: copyingId === post.id ? 0.7 : 1
                                        }}
                                    >
                                        {copyingId === post.id ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                일정 복제 중...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={16} />
                                                내 일정 보관함으로 복사하기
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </main>
            )}

            <PlaceDetailModal
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
            />

            {/* Custom Alert Modal */}
            <CustomAlertModal
                isOpen={alertOpen}
                type="alert"
                title={alertTitle}
                message={alertMsg}
                onConfirm={() => setAlertOpen(false)}
            />
        </>
    );
}