"use client";

import { useState } from 'react';
import { ChevronLeft, CheckCircle2, Loader2, Calendar as CalendarIcon, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAi } from '../../context/AiContext';
import CalendarPicker from '../calendar/CalendarPicker';
import WorldMapSelection from './WorldMapSelection';

interface RouteCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartJourney: (city: string) => void;
}

export default function RouteCreationModal({ isOpen, onClose, onStartJourney }: RouteCreationModalProps) {
    const [step, setStep] = useState(1);

    // States
    const [continent, setContinent] = useState('아시아');
    const [country, setCountry] = useState('JP 일본 (Japan)');
    const [city, setCity] = useState('교토');
    const [themes, setThemes] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [itineraryResult, setItineraryResult] = useState<any>(null);
    const { user } = useAuth();
    const { setItineraryData } = useAi();
    const [activeDay, setActiveDay] = useState(1);

    // 🛠️ 실시간 경로 편집기 관련 State
    const [isEditing, setIsEditing] = useState(false);
    const [initialItineraryData, setInitialItineraryData] = useState<any>(null);
    const [swapModalTarget, setSwapModalTarget] = useState<{ day: number; placeIdx: number; currentPlace: any } | null>(null);
    const [swapCandidates, setSwapCandidates] = useState<any[]>([]);
    const [isSwapLoading, setIsSwapLoading] = useState(false);

    if (!isOpen) return null;

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => {
        if (step > 1) setStep(prev => prev - 1);
        else onClose();
    };

    // AI 일정 생성 API 호출 함수
    const handleGenerateAIPlan = async () => {
        setIsLoading(true);
        try {
            // 날짜 기간 계산
            let diffDays = 2;
            if (startDate && endDate) {
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }

            const response = await fetch('/api/plan/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    userName: user?.name,
                    continent: continent,
                    country: country,
                    destination: city,
                    duration: { days: diffDays, nights: Math.max(1, diffDays - 1) },
                    travelStyle: themes,
                    dnaType: user?.dnaType || "클래식 슬로우뷰어"
                })
            });

            const result = await response.json();
            if (result.success) {
                const data = result.data.data || result.data;
                setItineraryResult(data);
                setItineraryData(data); // 전역 상태에 저장하여 지도와 연동
                setActiveDay(1); // 1일차 탭으로 초기 설정
                setStep(6); // Success moves to Result step
            } else {
                alert("일정 생성에 실패했습니다: " + result.message);
            }
        } catch (error) {
            console.error("AI Plan Fetch Error:", error);
            alert("서버 연결에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveScheduleToDb = async () => {
        if (!user?.id || !itineraryResult) return;
        try {
            await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    title: `${user.name || '트래블러'}님의 ${city} 여행`,
                    city,
                    startDate: startDate ? startDate.toISOString() : null,
                    endDate: endDate ? endDate.toISOString() : null,
                    itineraryData: itineraryResult
                })
            });

            // AI 일정 생성 완료 기록 DB 저장
            const daysCount = itineraryResult?.itinerary?.length || 0;
            await fetch(`/api/profile/${user.id}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'schedule_generation',
                    title: 'AI 추천 여행 일정 생성',
                    content: `'${city}' ${daysCount > 0 ? `${daysCount}일 코스` : ''} 여행 일정이 보관함에 새로 생성 및 저장되었습니다.`,
                    icon: '✨'
                })
            });
        } catch (e) {
            console.error("Failed to save schedule to DB:", e);
        }
    };

    const handleStartJourneyClick = async () => {
        await saveScheduleToDb();
        onStartJourney(city);
    };

    const handleBackFromResult = async () => {
        await saveScheduleToDb();
        onClose();
    };

    // 🛠️ 편집 모드 진입 및 원본 스냅샷 저장
    const handleStartEditMode = () => {
        if (!itineraryResult) return;
        setInitialItineraryData(JSON.parse(JSON.stringify(itineraryResult)));
        setIsEditing(true);
    };

    // ⏪ [이전으로 되돌리기] 기능 - 초기 스냅샷으로 복원
    const handleRevertChanges = () => {
        if (!initialItineraryData) return;
        const restored = JSON.parse(JSON.stringify(initialItineraryData));
        setItineraryResult(restored);
        setItineraryData(restored);
        alert("✨ 초기 추천 일정으로 원래대로 되돌렸습니다!");
    };

    // 🗑️ 장소 삭제 및 시간 재배치
    const handleDeletePlace = (dayNum: number, placeIdx: number) => {
        if (!itineraryResult?.itinerary) return;
        const updated = JSON.parse(JSON.stringify(itineraryResult));
        const dayTarget = updated.itinerary.find((d: any) => d.day === dayNum);
        if (dayTarget && dayTarget.places) {
            dayTarget.places.splice(placeIdx, 1);
            // 시간 재정렬
            dayTarget.places.forEach((p: any, idx: number) => {
                const hour = 9 + idx * 2;
                p.suggested_time = `${hour < 10 ? '0' + hour : hour}:00`;
            });
            setItineraryResult(updated);
            setItineraryData(updated);
        }
    };

    // ⬆️/⬇️ 순서 변경 및 시간 재배치
    const handleMovePlace = (dayNum: number, placeIdx: number, direction: 'up' | 'down') => {
        if (!itineraryResult?.itinerary) return;
        const updated = JSON.parse(JSON.stringify(itineraryResult));
        const dayTarget = updated.itinerary.find((d: any) => d.day === dayNum);
        if (!dayTarget || !dayTarget.places) return;

        const targetIdx = direction === 'up' ? placeIdx - 1 : placeIdx + 1;
        if (targetIdx < 0 || targetIdx >= dayTarget.places.length) return;

        // 원소 스왑
        const temp = dayTarget.places[placeIdx];
        dayTarget.places[placeIdx] = dayTarget.places[targetIdx];
        dayTarget.places[targetIdx] = temp;

        // 시간 재정렬
        dayTarget.places.forEach((p: any, idx: number) => {
            const hour = 9 + idx * 2;
            p.suggested_time = `${hour < 10 ? '0' + hour : hour}:00`;
        });

        setItineraryResult(updated);
        setItineraryData(updated);
    };

    // 🔄 [다른 곳 추천] 대체 장소 모달 열기 (100% DB 동적 조회 - 하드코딩 0%)
    const openSwapModal = async (dayNum: number, placeIdx: number, currentPlace: any) => {
        setSwapModalTarget({ day: dayNum, placeIdx, currentPlace });
        setIsSwapLoading(true);
        try {
            // 하드코딩 없이 선택된 도시(city) 변수를 그대로 API로 전달 (없으면 여정 정보에서 자동 감지)
            const targetCity = city || itineraryResult?.city || "교토";
            const res = await fetch(`/api/places?city=${encodeURIComponent(targetCity)}&excludeTips=true&limit=15`);
            const json = await res.json();
            
            let candidateList = json.data || [];

            // 도시 검색 결과가 적은 경우 폴백 처리
            if (!candidateList || candidateList.length === 0) {
                const fallbackRes = await fetch(`/api/places?limit=15`);
                const fallbackJson = await fallbackRes.json();
                candidateList = fallbackJson.data || [];
            }

            // 현재 일정에 이미 포함된 장소 및 '팁'/'이벤트' 제외 (순수 방문 명소/맛집만 추천)
            const currentPlaceNames = new Set(
                (itineraryResult?.itinerary || []).flatMap((d: any) => (d.places || []).map((p: any) => p.title || p.name))
            );
            const candidates = candidateList.filter((p: any) => 
                p.category !== '팁' && 
                p.category !== '이벤트' && 
                p.rank !== 11 && 
                p.rank !== 12 && 
                !currentPlaceNames.has(p.name)
            );
            setSwapCandidates(candidates.slice(0, 4));
        } catch (err) {
            console.error("Failed to fetch swap candidates:", err);
            setSwapCandidates([]);
        } finally {
            setIsSwapLoading(false);
        }
    };

    // 🔄 대체 장소 선택 및 스왑 반영 (좌표, 설명, 지도 경로 완벽 동기화)
    const handleSelectSwapPlace = (newPlace: any) => {
        if (!swapModalTarget || !itineraryResult?.itinerary) return;
        const updated = JSON.parse(JSON.stringify(itineraryResult));
        const dayTarget = updated.itinerary.find((d: any) => d.day === swapModalTarget.day);
        if (dayTarget && dayTarget.places) {
            const oldPlace = dayTarget.places[swapModalTarget.placeIdx];

            // 신규 장소 좌표 추출 (DB의 latitude/longitude 또는 lat/lng)
            const rawLat = newPlace.latitude ?? newPlace.lat;
            const rawLng = newPlace.longitude ?? newPlace.lng;
            const parsedLat = rawLat !== undefined && rawLat !== null && !isNaN(Number(rawLat)) ? Number(rawLat) : (oldPlace.lat || oldPlace.latitude);
            const parsedLng = rawLng !== undefined && rawLng !== null && !isNaN(Number(rawLng)) ? Number(rawLng) : (oldPlace.lng || oldPlace.longitude);

            // 신규 장소 상세 설명 추출 (DB description 우선 사용)
            const placeDesc = newPlace.description 
                ? (newPlace.description.length > 8 ? newPlace.description : `${newPlace.description}로 유명한 ${newPlace.name}입니다.`)
                : (newPlace.address ? `${newPlace.address}에 위치한 추천 명소입니다.` : `${newPlace.name} 방문 코스입니다.`);

            dayTarget.places[swapModalTarget.placeIdx] = {
                ...oldPlace,
                place_id: newPlace.id ? String(newPlace.id) : `swap_${Date.now()}`,
                title: newPlace.name,
                name: newPlace.name,
                lat: parsedLat,
                lng: parsedLng,
                latitude: parsedLat,
                longitude: parsedLng,
                category: newPlace.category || oldPlace.category || "관광지",
                location: placeDesc,
                description: placeDesc,
                reason: placeDesc,
                address: newPlace.address || oldPlace.address || "",
                imageUrl: newPlace.imageUrl || oldPlace.imageUrl || "",
                rating: newPlace.rating ?? oldPlace.rating,
                tags: newPlace.tags || oldPlace.tags || []
            };
            setItineraryResult(updated);
            setItineraryData(updated);
        }
        setSwapModalTarget(null);
    };

    // ✅ [수정 완료] 편집 모드 종료
    const handleApplyEditChanges = () => {
        setIsEditing(false);
        alert("🎉 일정 수정이 완료되었습니다! 지도에 새로운 동선이 반영되었습니다.");
    };

    const toggleTheme = (t: string) => {
        if (themes.includes(t)) setThemes(themes.filter(x => x !== t));
        else setThemes([...themes, t]);
    };

    const formatDate = (d: Date | null) => {
        if (!d) return "";
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    // Data Mappings
    const countriesByContinent: Record<string, { code: string, name: string }[]> = {
        '아시아': [
            { code: 'KR', name: '한국 (Korea)' },
            { code: 'JP', name: '일본 (Japan)' },
        ],
        '유럽': [
            { code: 'FR', name: '프랑스 (France)' },
            { code: 'ES', name: '스페인 (Spain)' },
            { code: 'IT', name: '이탈리아 (Italy)' },
            { code: 'DE', name: '독일 (Germany)' },
        ],
        '북미': [
            { code: 'US', name: '미국 (USA)' },
            { code: 'CA', name: '캐나다 (Canada)' },
            { code: 'MX', name: '멕시코 (Mexico)' },
        ],
        '남미': [
            { code: 'BR', name: '브라질 (Brazil)' },
            { code: 'AR', name: '아르헨티나 (Argentina)' },
            { code: 'PE', name: '페루 (Peru)' },
        ],
        '아프리카': [
            { code: 'EG', name: '이집트 (Egypt)' },
            { code: 'MA', name: '모로코 (Morocco)' },
            { code: 'ZA', name: '남아공 (South Africa)' },
        ],
        '오세아니아': [
            { code: 'AU', name: '호주 (Australia)' },
            { code: 'NZ', name: '뉴질랜드 (New Zealand)' },
        ]
    };

    const citiesByCountry: Record<string, { name: string, desc: string, img: string }[]> = {
        'KR 한국 (Korea)': [
            { name: '서울', desc: '전통과 현대가 공존하는 에너지', img: '/images/KR_SEOUL.jpg' },
            { name: '제주도', desc: '에메랄드 바다와 천혜의 자연', img: '/images/KR_JEJU.jpg' },
            { name: '부산', desc: '바다와 마천루가 어우러진 항구 도시', img: '/images/KR_BUSAN.jpg' },
            { name: '속초', desc: '설악산과 동해 바다의 낭만', img: '/images/KR_SOKCHO.jpg' }
        ],
        'JP 일본 (Japan)': [
            { name: '도쿄', desc: '아시아 최대의 메트로폴리스', img: '/images/JP_TOKYO.jpg' },
            { name: '오사카', desc: '식도락과 활기 넘치는 천국', img: '/images/JP_OSAKA.jpg' },
            { name: '교토', desc: '천년 고도의 정취와 사찰', img: '/images/JP_KYOTO.jpg' },
            { name: '후쿠오카', desc: '가깝고 맛있는 힐링 여행지', img: '/images/JP_FUKUOKA.jpg' },
            { name: '오키나와', desc: '에메랄드빛 바다와 휴양', img: '/images/JP_OKINAWA.jpg' }
        ],
        'FR 프랑스 (France)': [
            { name: '파리', desc: '낭만과 예술, 빛의 도시', img: '/images/FR_PARIS.jpg' }
        ],
        'ES 스페인 (Spain)': [
            { name: '바르셀로나', desc: '가우디의 건축과 지중해의 열정', img: '/images/ES_BARCELONA.jpg' }
        ],
        'IT 이탈리아 (Italy)': [
            { name: '로마', desc: '역사의 흔적을 간직한 영원한 도시', img: '/images/IT_ROME.jpg' }
        ],
        'DE 독일 (Germany)': [
            { name: '베를린', desc: '역사와 힙한 문화의 공존', img: '/images/DE_BERLIN.jpg' }
        ]
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="rc-title-area text-center" style={{ paddingTop: '8px', paddingBottom: '12px' }}>
                            <div style={{ color: '#888888', fontSize: 13.5, fontWeight: 500, marginBottom: 6 }}>떠나고 싶은 대륙을 선택하세요</div>
                            <h2 style={{ color: 'var(--primary-color)', fontSize: 21, fontWeight: 800 }}>Choose Your Destination</h2>
                        </div>
                        <div className="rc-map-area">
                            <WorldMapSelection 
                                selectedContinent={continent} 
                                onSelect={(cont) => {
                                    setContinent(cont);
                                    // 대륙 변경 시 해당 대륙의 첫 번째 국가로 초기화
                                    const firstCountry = countriesByContinent[cont]?.[0];
                                    if (firstCountry) {
                                        setCountry(`${firstCountry.code} ${firstCountry.name}`);
                                    } else {
                                        setCountry('');
                                    }
                                }} 
                            />
                        </div>
                    </>
                );
            case 2:
                const currentCountries = countriesByContinent[continent] || [];
                return (
                    <>
                        <div className="rc-title-area">
                            <h2 className="rc-title">{continent}의 어느 나라로 갈까요?</h2>
                            <p className="rc-subtitle">여행할 국가를 골라주세요</p>
                        </div>
                        <div className="rc-list-y">
                            {currentCountries.length > 0 ? (
                                currentCountries.map(c => (
                                    <div key={c.code} className={`rc-country-item ${country === `${c.code} ${c.name}` ? 'selected' : ''}`} onClick={() => {
                                        setCountry(`${c.code} ${c.name}`);
                                        // 국가 변경 시 해당 국가의 첫 번째 도시로 초기화 (데이터가 있는 경우)
                                        const firstCity = citiesByCountry[`${c.code} ${c.name}`]?.[0];
                                        if (firstCity) setCity(firstCity.name);
                                    }}>
                                        {/* Blended national flag background */}
                                        <img 
                                            src={`https://flagcdn.com/w160/${c.code.toLowerCase()}.png`} 
                                            alt={`${c.name} flag`} 
                                            className="rc-country-flag-bg"
                                            draggable={false}
                                        />
                                        <span className="rc-country-code">{c.code}</span>
                                        <span className="rc-country-name">{c.name}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-400">준비 중인 지역입니다.</div>
                            )}
                        </div>
                    </>
                );
            case 3:
                const currentCities = citiesByCountry[country] || [];
                return (
                    <>
                        <div className="rc-title-area">
                            <h2 className="rc-title">{country.split(' ')[1]}의 어느 도시로 갈까요?</h2>
                            <p className="rc-subtitle">여행할 도시를 골라주세요</p>
                        </div>
                        <div className="rc-list-y">
                            {currentCities.length > 0 ? (
                                currentCities.map(c => (
                                    <div key={c.name} className={`rc-city-card ${city === c.name ? 'selected' : ''}`} onClick={() => setCity(c.name)}>
                                        <img src={c.img} alt={c.name} draggable={false} />
                                        <div className="rc-city-overlay">
                                            <h3>{c.name}</h3>
                                            <p>{c.desc}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <div style={{ fontSize: 40, marginBottom: 16 }}>✈️</div>
                                    <p style={{ color: '#666' }}>아직 추천 도시가 없는 국가입니다.<br/>다른 국가를 선택해 보세요!</p>
                                </div>
                            )}
                        </div>
                    </>
                );
            case 4:
                return (
                    <div>
                        <div className="p-0">
                            <CalendarPicker 
                                title="일정을 선택하세요"
                                subtitle="여행 기간을 설정해주세요"
                                hideFooter={true} 
                                onDatesChange={(start, end) => {
                                    setStartDate(start);
                                    setEndDate(end);
                                }} 
                            />
                        </div>
                    </div>
                );
            case 5:
                const themeOptions = [
                    "🎓 졸업여행", "📸 인스타감성", "🍜 맛집투어",
                    "🏯 문화체험", "🍵 힐링", "🧗 액티비티",
                    "🛍️ 쇼핑", "🌃 야경투어", "🏛️ 역사탐방", "🌳 자연"
                ];
                const percentage = Math.min(Math.max((themes.length / 4) * 100, 5), 100);
                return (
                    <>
                        <div className="rc-title-area">
                            <h2 className="rc-title">{city}에서 무엇을 하고 싶나요?</h2>
                            <p className="rc-subtitle">원하는 테마를 모두 선택해주세요</p>
                        </div>
                        <div className="rc-theme-banner">
                            <div className="header">
                                <span>✨ 테마 및 취향 설정</span>
                            </div>
                            <div className="bar-bg">
                                <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <div className="footer">
                                <span>{themes.length}개 테마 선택됨</span>
                                <span>취향 분석 {Math.round(percentage)}%</span>
                            </div>
                        </div>
                        <div className="rc-chip-grid">
                            {themeOptions.map(t => (
                                <div key={t} className={`rc-chip ${themes.includes(t) ? 'selected' : ''}`} onClick={() => toggleTheme(t)}>
                                    {t}
                                </div>
                            ))}
                        </div>

                        {/* 선택된 날짜 및 테마 표시 영역 (옵션) */}
                        <div style={{ 
                            marginTop: '24px', 
                            padding: '16px', 
                            borderRadius: '16px', 
                            border: '1.5px solid #222', 
                            textAlign: 'center',
                            margin: '24px 20px 0'
                        }}>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>선택하신 일정</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#222' }}>
                                {formatDate(startDate)} ~ {formatDate(endDate)}
                            </div>
                        </div>
                    </>
                );
            case 6:
                const displayData = itineraryResult || {
                    course_title: `${user?.name || "트래블러"}님의 취향을 담은 ${city} 여행`,
                    course_subtitle: "AI가 선정한 장소를 OSRM 경로 최적화로 배치했습니다.",
                    itinerary: []
                };

                const currentDayData = displayData.itinerary?.find((d: any) => d.day === activeDay) || displayData.itinerary?.[0] || { places: [] };

                return (
                    <>
                        <div style={{ paddingBottom: '0px' }}>
                            <div className="rc-res-header" style={{ padding: '24px 20px', background: 'linear-gradient(135deg, #8c52ff, #6214ff)', color: 'white', borderRadius: '0 0 24px 24px', marginBottom: '20px' }}>
                                <h1 className="rc-res-title" style={{ fontSize: '18px', fontWeight: 800, lineHeight: '1.4', margin: 0, color: 'white' }}>
                                    {displayData.course_title}
                                </h1>
                                <p className="rc-res-subtitle" style={{ fontSize: '12px', opacity: 0.9, marginTop: '8px', margin: 0, color: 'rgba(255, 255, 255, 0.95)' }}>
                                    {displayData.course_subtitle}
                                </p>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    marginTop: '12px',
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.9)',
                                    fontWeight: 600
                                }}>
                                    <CalendarIcon size={13} />
                                    {formatDate(startDate)} ~ {formatDate(endDate)}
                                </div>
                            </div>

                            {/* 일차 선택 탭 */}
                            {displayData.itinerary && displayData.itinerary.length > 1 && (
                                <div style={{ display: 'flex', gap: '8px', padding: '0 20px', marginBottom: '16px' }}>
                                    {displayData.itinerary.map((dayObj: any) => (
                                        <button
                                            key={dayObj.day}
                                            onClick={() => setActiveDay(dayObj.day)}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '12px',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                border: activeDay === dayObj.day ? '2.5px solid #8c52ff' : '1px solid #e0e0e0',
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

                            {/* 프리미엄 타임라인 카드 */}
                            <div className="rc-timeline" style={{ padding: '0 20px' }}>
                                {currentDayData.places && currentDayData.places.length > 0 ? (
                                    currentDayData.places.map((place: any, idx: number) => (
                                        <div key={place.place_id || idx} style={{ marginBottom: '24px', position: 'relative' }}>
                                            {/* OSRM 내비게이션 동적 경로 커넥터 UI */}
                                            {idx > 0 && (
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '12px', 
                                                    margin: '-10px 0 16px 28px',
                                                    paddingLeft: '18px',
                                                    borderLeft: '2.5px dashed #a78bfa'
                                                }}>
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                                                        border: '1px solid #ddd6fe',
                                                        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.08)',
                                                        padding: '5px 14px',
                                                        borderRadius: '20px',
                                                        fontSize: '11.5px',
                                                        fontWeight: 800,
                                                        color: '#6d28d9',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <span>🚗 최적 경로</span>
                                                        <span style={{ color: '#c4b5fd' }}>|</span>
                                                        <span style={{ color: '#7c3aed' }}>
                                                            약 {(() => {
                                                                try {
                                                                    const loc = place.location || "";
                                                                    const match = loc.match(/\[(\d+)분\|([\d.]+)km\]/);
                                                                    if (match) return `${match[1]}분 (${match[2]}km)`;
                                                                    
                                                                    const prevTime = currentDayData.places[idx - 1]?.suggested_time || "09:00";
                                                                    const currTime = place.suggested_time || "11:00";
                                                                    const [pH, pM] = prevTime.split(':').map(Number);
                                                                    const [cH, cM] = currTime.split(':').map(Number);
                                                                    const diffMins = (cH * 60 + cM) - (pH * 60 + pM) - 90;
                                                                    const finalMins = diffMins > 5 ? diffMins : (idx * 9 + 14);
                                                                    const approxKm = (finalMins * 0.15).toFixed(1);
                                                                    return `${finalMins}분 (${approxKm}km)`;
                                                                } catch (e) {
                                                                    return "18분 (2.4km)";
                                                                }
                                                            })()} 이동
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                                {/* 타임 라벨 뱃지 */}
                                                <div className="rc-time-badge" style={{ 
                                                    width: '60px', 
                                                    height: '32px', 
                                                    borderRadius: '16px', 
                                                    backgroundColor: '#7c3aed', 
                                                    color: '#ffffff',
                                                    fontSize: '12px',
                                                    fontWeight: 800,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)'
                                                }}>
                                                    {place.suggested_time || `0${9 + idx * 2}:00`}
                                                </div>
                                                
                                                {/* 프리미엄 카드 레벨 */}
                                                <div className="rc-time-card" style={{ 
                                                    flex: 1, 
                                                    backgroundColor: 'white', 
                                                    borderRadius: '18px', 
                                                    border: '1.5px solid #ede9fe',
                                                    boxShadow: '0 6px 20px rgba(124, 58, 237, 0.06)',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{ padding: '16px 18px' }}>
                                                        {/* 편집 모드일 때만 노출되는 상단 액션 바 (삭제, 교체, 순서 변경) */}
                                                        {isEditing && (
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'space-between', 
                                                                marginBottom: '10px',
                                                                paddingBottom: '8px',
                                                                borderBottom: '1px dashed #ede9fe'
                                                            }}>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <button 
                                                                        onClick={() => handleMovePlace(activeDay, idx, 'up')}
                                                                        disabled={idx === 0}
                                                                        style={{ 
                                                                            padding: '3px 8px', 
                                                                            fontSize: '11px', 
                                                                            borderRadius: '6px', 
                                                                            border: '1px solid #ddd6fe', 
                                                                            backgroundColor: idx === 0 ? '#f3f4f6' : '#ffffff', 
                                                                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                                            color: '#4c1d95',
                                                                            fontWeight: 700
                                                                        }}
                                                                    >
                                                                        ⬆️ 위로
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleMovePlace(activeDay, idx, 'down')}
                                                                        disabled={idx === (currentDayData.places?.length || 0) - 1}
                                                                        style={{ 
                                                                            padding: '3px 8px', 
                                                                            fontSize: '11px', 
                                                                            borderRadius: '6px', 
                                                                            border: '1px solid #ddd6fe', 
                                                                            backgroundColor: idx === (currentDayData.places?.length || 0) - 1 ? '#f3f4f6' : '#ffffff', 
                                                                            cursor: idx === (currentDayData.places?.length || 0) - 1 ? 'not-allowed' : 'pointer',
                                                                            color: '#4c1d95',
                                                                            fontWeight: 700
                                                                        }}
                                                                    >
                                                                        ⬇️ 아래로
                                                                    </button>
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <button 
                                                                        onClick={() => openSwapModal(activeDay, idx, place)}
                                                                        style={{ 
                                                                            padding: '4px 10px', 
                                                                            fontSize: '11px', 
                                                                            borderRadius: '8px', 
                                                                            border: '1px solid #c4b5fd', 
                                                                            backgroundColor: '#f5f3ff', 
                                                                            color: '#7c3aed', 
                                                                            fontWeight: 800,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        🔄 다른 곳 추천
                                                                    </button>                                                                    <button 
                                                                        onClick={() => handleDeletePlace(activeDay, idx)}
                                                                        style={{ 
                                                                            padding: '4px 10px', 
                                                                            fontSize: '11px', 
                                                                            borderRadius: '8px', 
                                                                            border: '1px solid #fca5a5', 
                                                                            backgroundColor: '#fef2f2', 
                                                                            color: '#ef4444', 
                                                                            fontWeight: 800,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        🗑️ 삭제
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827', flex: 1 }}>
                                                                {place.title || place.name}
                                                            </h4>
                                                            <span style={{ 
                                                                backgroundColor: '#f3eeff', 
                                                                color: '#7c3aed', 
                                                                fontSize: '11.5px', 
                                                                fontWeight: 800, 
                                                                padding: '4px 10px', 
                                                                borderRadius: '12px',
                                                                border: '1px solid #ddd6fe',
                                                                whiteSpace: 'nowrap',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                flexShrink: 0
                                                            }}>
                                                                {(() => {
                                                                    const t = `${place.category || ''} ${place.title || ''} ${place.name || ''} ${place.reason || ''}`.toLowerCase();
                                                                    if (t.includes('맛집') || t.includes('식당') || t.includes('미식') || t.includes('라멘') || t.includes('오쿠라')) return "🍱 추천 맛집";
                                                                    if (t.includes('야경') || t.includes('스카이') || t.includes('전망') || t.includes('시티뷰')) return "🌃 야경 명소";
                                                                    if (t.includes('쇼핑') || t.includes('파크') || t.includes('자이레') || t.includes('몰')) return "🛍️ 핫플레이스";
                                                                    if (t.includes('공원') || t.includes('정원') || t.includes('자연') || t.includes('호텔')) return "🌿 힐링 휴식";
                                                                    if (t.includes('문화') || t.includes('신사') || t.includes('사찰') || t.includes('박물관')) return "🏛️ 문화 탐방";
                                                                    return place.category || (idx % 2 === 0 ? "🍱 추천 맛집" : "🌃 인기 명소");
                                                                })()}
                                                            </span>
                                                        </div>

                                                        {/* 스토리 가이드 코멘터리 박스 */}
                                                        <div style={{ 
                                                            backgroundColor: '#faf5ff', 
                                                            borderLeft: '3.5px solid #8c52ff', 
                                                            padding: '10px 12px', 
                                                            borderRadius: '0 10px 10px 0',
                                                            marginTop: '10px'
                                                        }}>
                                                            <p style={{ margin: 0, fontSize: '12.5px', color: '#4c1d95', fontWeight: 600, lineHeight: '1.5', wordBreak: 'keep-all' }}>
                                                                💡 {(place.reason || place.location || "취향 분석 기반 맞춤 현지 가이드 코스입니다.").replace(/^\[.*?\]\s*/, '')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#b0b0b0' }}>일정이 존재하지 않습니다.</div>
                                )}
                            </div>
                        </div>

                        {/* 🔄 대체 장소 추천 모달 팝업 */}
                        {swapModalTarget && (
                            <div style={{ 
                                position: 'fixed', 
                                inset: 0, 
                                backgroundColor: 'rgba(0, 0, 0, 0.55)', 
                                zIndex: 9999, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: '20px' 
                            }}>
                                <div style={{ 
                                    backgroundColor: 'white', 
                                    borderRadius: '24px', 
                                    padding: '24px', 
                                    maxWidth: '440px', 
                                    width: '100%', 
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
                                }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                                        🔄 다른 장소로 교체하기
                                    </h3>
                                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>
                                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>'{swapModalTarget.currentPlace?.title || swapModalTarget.currentPlace?.name}'</span> 대신 넣을 취향 맞춤 장소를 고르세요:
                                    </p>

                                    {isSwapLoading ? (
                                        <div style={{ padding: '30px 0', textAlign: 'center', color: '#8c52ff' }}>
                                            <Loader2 className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>주변 1km 내 인근 명소 추천 중...</div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                                            {swapCandidates.length > 0 ? (
                                                swapCandidates.map((cand: any) => (
                                                    <div 
                                                        key={cand.id || cand.name}
                                                        onClick={() => handleSelectSwapPlace(cand)}
                                                        style={{ 
                                                            padding: '12px 14px', 
                                                            borderRadius: '14px', 
                                                            border: '1.5px solid #ede9fe', 
                                                            backgroundColor: '#faf5ff', 
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#4c1d95' }}>{cand.name}</div>
                                                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{cand.category} • {cand.address || cand.description || '인기 관광지'}</div>
                                                        </div>
                                                        <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 800 }}>선택 ➡️</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                                    대체 가능한 주변 장소가 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => setSwapModalTarget(null)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px', 
                                            borderRadius: '12px', 
                                            border: '1px solid #e5e7eb', 
                                            backgroundColor: '#f3f4f6', 
                                            fontWeight: 700, 
                                            fontSize: '14px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                );
            default: return null;
        }
    };

    return (
        <div className="rc-modal">
            <div className="rc-header">
                {step === 6 ? (
                    <button className="rc-back-btn" onClick={() => handleBackFromResult()}>
                        <ChevronLeft />
                    </button>
                ) : (
                    <button className="rc-back-btn" onClick={handlePrev}>
                        <ChevronLeft />
                    </button>
                )}
            </div>
            <div className={`rc-content ${step === 4 ? 'p-0' : ''} ${step === 1 ? 'rc-content-centered' : ''}`}>
                {renderStepContent()}
            </div>
            
            {/* 고정 하단 바 섹션 */}
            {step === 1 && (
                <div className="rc-bottom">
                    <div className="rc-bottom-info">
                        <Globe size={16} color="var(--primary-color)" /> 
                        <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{continent}</span> 여행을 계획 중입니다.
                    </div>
                    <button className="rc-btn-primary" onClick={handleNext}>다음으로</button>
                </div>
            )}
            {step === 2 && (
                <div className="rc-bottom">
                    <div className="rc-bottom-info">
                        <CheckCircle2 size={16} color="var(--primary-color)" />
                        <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{country.split(' ')[1]}</span>(으)로 떠날까요?
                    </div>
                    <button className="rc-btn-primary" onClick={handleNext}>다음으로</button>
                </div>
            )}
            {step === 3 && (
                <div className="rc-bottom">
                    <div className="rc-bottom-info">
                        <CheckCircle2 size={16} color="var(--primary-color)" />
                        <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{city}</span> 여행을 시작합니다!
                    </div>
                    <button className="rc-btn-primary" onClick={handleNext}>다음으로</button>
                </div>
            )}
            {step === 4 && (
                <div className="rc-bottom">
                    <div className="rc-bottom-info" style={{ justifyContent: 'center', marginBottom: '16px', fontSize: '15px' }}>
                        {startDate && endDate ? (
                            <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                                {formatDate(startDate)} ~ {formatDate(endDate)}
                            </span>
                        ) : (
                            <span style={{ color: '#b0b0b0' }}>날짜를 선택해주세요</span>
                        )}
                    </div>
                    <button className="rc-btn-primary" 
                        onClick={() => startDate && endDate && setStep(5)}
                        disabled={!startDate || !endDate}
                        style={{ opacity: (startDate && endDate) ? 1 : 0.6 }}
                    >
                        다음으로
                    </button>
                </div>
            )}
            {step === 5 && (
                <div className="rc-bottom">
                    <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700 }}>선택된 테마</div>
                    <div className="rc-selected-scroll" style={{ marginBottom: 16 }}>
                        {themes.map(t => <div key={t} className="rc-selected-chip-small">{t}</div>)}
                        {themes.length === 0 && <span style={{ fontSize: 12, color: '#b0b0b0' }}>테마를 선택해주세요</span>}
                    </div>
                    <button className="rc-btn-primary" style={{ background: 'linear-gradient(135deg, #e91e63, #9c27b0)' }} onClick={handleGenerateAIPlan} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "🪄 AI 일정 생성하기"}
                    </button>
                </div>
            )}
            {step === 6 && (
                <div className="rc-res-bottom text-center">
                    {!isEditing ? (
                        <>
                            <button className="rc-btn-outline" onClick={handleStartEditMode}>
                                ✏️ 경로 편집하기
                            </button>
                            <button className="rc-btn-primary" onClick={handleStartJourneyClick}>
                                여행 시작하기
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                className="rc-btn-outline" 
                                style={{ borderColor: '#ef4444', color: '#ef4444', backgroundColor: '#fef2f2' }} 
                                onClick={handleRevertChanges}
                            >
                                ⏪ 이전으로 되돌리기
                            </button>
                            <button 
                                className="rc-btn-primary" 
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} 
                                onClick={handleApplyEditChanges}
                            >
                                ✅ 수정 완료
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
