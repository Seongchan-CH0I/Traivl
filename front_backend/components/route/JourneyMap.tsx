import { ChevronLeft, Menu, MapPin, Star, Bus, Navigation } from 'lucide-react';
import { useAi } from '../../context/AiContext';
import { useEffect, useState } from 'react';

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

const CITY_START_NAMES: Record<string, string> = {
    '서울': '서울역',
    '제주도': '제주공항',
    '부산': '부산역',
    '속초': '속초고속버스터미널',
    '도쿄': '도쿄역',
    '오사카': '오사카역',
    '교토': '교토역',
    '후쿠오카': '하카타역',
    '오키나와': '나하공항',
    '파리': '파리 북역',
    '바르셀로나': '카탈루냐 광장',
    '로마': '테르미니역',
    '베를린': '베를린 중앙역',
};

const CITY_AIRPORTS: Record<string, { name: string, lat: number, lng: number }> = {
    '서울': { name: '인천국제공항', lat: 37.4602, lng: 126.4407 },
    '제주도': { name: '제주국제공항', lat: 33.5113, lng: 126.4930 },
    '부산': { name: '김해국제공항', lat: 35.1795, lng: 128.9382 },
    '속초': { name: '양양국제공항', lat: 38.0614, lng: 128.6693 },
    '도쿄': { name: '하네다 국제공항', lat: 35.5494, lng: 139.7798 },
    '오사카': { name: '간사이 국제공항', lat: 34.4320, lng: 135.2304 },
    '교토': { name: '간사이 국제공항', lat: 34.4320, lng: 135.2304 },
    '후쿠오카': { name: '후쿠오카 공항', lat: 33.5859, lng: 130.4507 },
    '오키나와': { name: '나하 공항', lat: 26.2064, lng: 127.6465 },
    '파리': { name: '샤를 드 골 국제공항', lat: 49.0097, lng: 2.5479 },
    '바르셀로나': { name: '엘 프라트 국제공항', lat: 41.2974, lng: 2.0833 },
    '로마': { name: '레오나르도 다 빈치 피우미치노 공항', lat: 41.7999, lng: 12.2462 },
    '베를린': { name: '베를린 브란덴부르크 공항', lat: 52.3667, lng: 13.5033 },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export default function JourneyMap({ onBack }: { onBack: () => void }) {
    const { toggleAiMenu, isAiMenuOpen, setIsJourneyMapMode, itineraryData, selectedCity } = useAi();
    
    // 상태 관리
    const [routeMode, setRouteMode] = useState<'walking' | 'transit'>('walking');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; isVirtual: boolean } | null>(null);
    const [isLocating, setIsLocating] = useState(true);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [showVirtualAlert, setShowVirtualAlert] = useState(false);
    
    // 삼선 메뉴 및 단계별 안내 상태
    const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
    const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);   // 💡 일차별 상태 추가 (0: 1일차, 1: 2일차 ...)
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1: 출발지 -> 1번째 방문지
    const [isAirportMode, setIsAirportMode] = useState<boolean>(false);   // 공항 안내 모드 여부

    // 전역 AI 일정 데이터 파싱
    const daysList = itineraryData?.itinerary || [];
    const currentDay = daysList[currentDayIndex];
    const placesList = currentDay?.places || [];
    
    // Day별 Fallback 계산용 좌표
    const firstPlace = placesList[0];
    const destinationTitle = firstPlace?.title || "간사이 공항";
    const recommendedReason = firstPlace?.location || "여행의 설레는 첫 출발지입니다.";
    const destLat = firstPlace?.lat || firstPlace?.latitude || 35.0394;
    const destLng = firstPlace?.lng || firstPlace?.longitude || 135.7292;

    // 1. Leaflet CDN (CSS & JS) 동적 로드
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const cssId = 'leaflet-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        
        const jsId = 'leaflet-js';
        if (!document.getElementById(jsId)) {
            const script = document.createElement('script');
            script.id = jsId;
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => setLeafletLoaded(true);
            document.head.appendChild(script);
        } else {
            if ((window as any).L) {
                setLeafletLoaded(true);
            } else {
                const interval = setInterval(() => {
                    if ((window as any).L) {
                        setLeafletLoaded(true);
                        clearInterval(interval);
                    }
                }, 100);
            }
        }
    }, []);

    // 2. 현재 위치 (GPS 또는 가상 시작점) 획득
    useEffect(() => {
        setIsJourneyMapMode(true);
        
        const cityKey = selectedCity || "교토";
        const virtualCenter = CITY_CENTERS[cityKey] || { lat: destLat - 0.007, lng: destLng - 0.007 };

        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const realLat = position.coords.latitude;
                    const realLng = position.coords.longitude;
                    const dist = calculateDistance(realLat, realLng, destLat, destLng);
                    
                    if (dist > 100) {
                        setUserLocation({ lat: virtualCenter.lat, lng: virtualCenter.lng, isVirtual: true });
                    } else {
                        setUserLocation({ lat: realLat, lng: realLng, isVirtual: false });
                    }
                    setIsLocating(false);
                },
                (error) => {
                    console.warn("Geolocation failed, using virtual location:", error);
                    setUserLocation({ lat: virtualCenter.lat, lng: virtualCenter.lng, isVirtual: true });
                    setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            setUserLocation({ lat: virtualCenter.lat, lng: virtualCenter.lng, isVirtual: true });
            setIsLocating(false);
        }

        return () => setIsJourneyMapMode(false);
    }, [setIsJourneyMapMode, destLat, destLng, selectedCity]);

    // 3. 현재 위치 정보에 기반한 출발지 이름 설정
    const startPlaceName = userLocation?.isVirtual
        ? (CITY_START_NAMES[selectedCity || "교토"] || `${selectedCity || "교토"}역`)
        : "현재 위치";

    // 4. 현재 여정 단계에 맞는 출발지(startPoint)와 목적지(destPoint) 결정
    const cityKey = selectedCity || "교토";
    let startPoint: { name: string, lat: number, lng: number } = {
        name: startPlaceName,
        lat: userLocation?.lat || 35.0116,
        lng: userLocation?.lng || 135.7681
    };
    
    let destPoint: { name: string, lat: number, lng: number, reason: string } = {
        name: destinationTitle,
        lat: destLat,
        lng: destLng,
        reason: recommendedReason
    };

    if (isAirportMode) {
        // 공항 안내 모드
        const airport = CITY_AIRPORTS[cityKey] || { name: '공항', lat: destLat, lng: destLng };
        if (currentStepIndex >= 0 && currentStepIndex < placesList.length) {
            const currentPlace = placesList[currentStepIndex];
            startPoint = {
                name: currentPlace.title,
                lat: currentPlace.lat || currentPlace.latitude || destLat,
                lng: currentPlace.longitude || currentPlace.lng || destLng
            };
        }
        destPoint = {
            name: airport.name,
            lat: airport.lat,
            lng: airport.lng,
            reason: `${cityKey} 여행을 마무리하고 안전하게 공항으로 이동하는 경로입니다. 비행기 탑승 시간에 늦지 않도록 조심히 이동하세요!`
        };
    } else if (currentStepIndex >= 0) {
        // 다음 경로 탐색 모드 (방문지 N -> 방문지 N+1)
        const currentPlace = placesList[currentStepIndex];
        const nextPlace = placesList[currentStepIndex + 1];
        
        startPoint = {
            name: currentPlace.title,
            lat: currentPlace.lat || currentPlace.latitude || destLat,
            lng: currentPlace.lng || currentPlace.longitude || destLng
        };
        
        if (nextPlace) {
            destPoint = {
                name: nextPlace.title,
                lat: nextPlace.lat || nextPlace.latitude || destLat,
                lng: nextPlace.lng || nextPlace.longitude || destLng,
                reason: nextPlace.location || "다음 목적지로 안전하게 안내합니다."
            };
        }
    }

    // 5. Leaflet 맵 초기화 및 마커/경로 렌더링
    useEffect(() => {
        if (!leafletLoaded || !userLocation || typeof window === 'undefined') return;
        
        const L = (window as any).L;
        if (!L) return;

        const container = document.getElementById('jm-leaflet-map');
        if (!container) return;

        // Leaflet 인스턴스 생성
        const map = L.map('jm-leaflet-map', { 
            zoomControl: false, 
            attributionControl: false 
        });

        // Voyager 지도 타일 레이어 적용
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        const startCoords: [number, number] = [startPoint.lat, startPoint.lng];
        const destCoords: [number, number] = [destPoint.lat, destPoint.lng];

        // 커스텀 출발 마커 (Label + pulsing dot)
        const currentIcon = L.divIcon({
            className: 'custom-map-marker-current',
            html: `
                <div class="map-marker-wrapper">
                    <div class="map-marker-label label-current">${startPoint.name}</div>
                    <div class="map-marker-outer-current">
                        <div class="map-marker-inner-current"></div>
                    </div>
                </div>
            `,
            iconSize: [80, 50],
            iconAnchor: [40, 45]
        });

        // 커스텀 목적지 마커 (Label + pulsing red dot)
        const destIcon = L.divIcon({
            className: 'custom-map-marker-dest',
            html: `
                <div class="map-marker-wrapper">
                    <div class="map-marker-label label-dest">${destPoint.name.slice(0, 10)}</div>
                    <div class="map-marker-outer-dest">
                        <div class="map-marker-inner-dest"></div>
                    </div>
                </div>
            `,
            iconSize: [80, 50],
            iconAnchor: [40, 45]
        });

        // 마커 지도에 추가
        const startMarker = L.marker(startCoords, { icon: currentIcon }).addTo(map);
        const destMarker = L.marker(destCoords, { icon: destIcon }).addTo(map);

        // 플래닝 모드에서 첫 마커 클릭 시 얼럿 팝업 띄우기
        startMarker.on('click', () => {
            if (userLocation.isVirtual && currentStepIndex === -1 && !isAirportMode) {
                setShowVirtualAlert(true);
            }
        });

        // 경로 그리기
        let pathLine: any;
        if (routeMode === 'walking') {
            // 도보: 파란색 점선
            pathLine = L.polyline([startCoords, destCoords], {
                color: '#3182f6',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.8
            }).addTo(map);
        } else {
            // 대중교통: 보라색 부드러운 2차 베지에 곡선 경로 시뮬레이션
            const midLat = (startCoords[0] + destCoords[0]) / 2;
            const midLng = (startCoords[1] + destCoords[1]) / 2;
            const offsetLat = (destCoords[1] - startCoords[1]) * 0.15;
            const offsetLng = (startCoords[0] - destCoords[0]) * 0.15;
            const controlCoords: [number, number] = [midLat + offsetLat, midLng + offsetLng];
            
            const curvePoints = [];
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                const lat = (1 - t) * (1 - t) * startCoords[0] + 2 * (1 - t) * t * controlCoords[0] + t * t * destCoords[0];
                const lng = (1 - t) * (1 - t) * startCoords[1] + 2 * (1 - t) * t * controlCoords[1] + t * t * destCoords[1];
                curvePoints.push([lat, lng]);
            }

            pathLine = L.polyline(curvePoints, {
                color: '#8c52ff',
                weight: 5,
                opacity: 0.8
            }).addTo(map);
        }

        // 두 좌표가 완벽하게 다 보이도록 맵 범위 피팅
        const group = new L.featureGroup([startMarker, destMarker]);
        map.fitBounds(group.getBounds().pad(0.35));

        return () => {
            map.remove();
        };
    }, [leafletLoaded, userLocation, routeMode, startPoint.lat, startPoint.lng, startPoint.name, destPoint.lat, destPoint.lng, destPoint.name]);

    // 거리 및 시간 계산
    const distance = calculateDistance(startPoint.lat, startPoint.lng, destPoint.lat, destPoint.lng);

    const walkTime = Math.max(3, Math.round((distance / 4.5) * 60));
    const transitTime = Math.max(3, Math.round((distance / 20) * 60) + 8);

    // 구글맵 연동
    const handleGoClick = () => {
        if (!userLocation) return;
        const mode = routeMode === 'walking' ? 'walking' : 'transit';
        const url = `https://www.google.com/maps/dir/?api=1&origin=${startPoint.lat},${startPoint.lng}&destination=${destPoint.lat},${destPoint.lng}&travelmode=${mode}`;
        window.open(url, '_blank');
    };

    // 대중교통/도보 모드 전환
    const handleAlternativeClick = () => {
        setRouteMode(prev => prev === 'walking' ? 'transit' : 'walking');
    };

    return (
        <div className="journey-container">
            {/* 스타일 태그 주입: Leaflet의 동적 커스텀 디자인 처리 */}
            <style>{`
                .custom-map-marker-current, .custom-map-marker-dest {
                    background: none !important;
                    border: none !important;
                }
                
                .map-marker-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    position: relative;
                    width: 80px;
                    height: 50px;
                }
                
                .map-marker-label {
                    white-space: nowrap;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    color: white;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                    margin-bottom: 6px;
                    position: relative;
                }
                
                .label-current {
                    background: #3182f6;
                }
                .label-current::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 4px 4px 0;
                    border-style: solid;
                    border-color: #3182f6 transparent transparent;
                }
                
                .label-dest {
                    background: #ff4757;
                }
                .label-dest::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 4px 4px 0;
                    border-style: solid;
                    border-color: #ff4757 transparent transparent;
                }
                
                .map-marker-outer-current {
                    width: 20px;
                    height: 20px;
                    background: rgba(49, 130, 246, 0.2);
                    border: 1.5px solid rgba(49, 130, 246, 0.6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulseMarker 2s infinite;
                }
                .map-marker-inner-current {
                    width: 10px;
                    height: 10px;
                    background: #3182f6;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                
                .map-marker-outer-dest {
                    width: 20px;
                    height: 20px;
                    background: rgba(255, 71, 87, 0.2);
                    border: 1.5px solid rgba(255, 71, 87, 0.6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulseMarker 2s infinite alternate;
                }
                .map-marker-inner-dest {
                    width: 10px;
                    height: 10px;
                    background: #ff4757;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                
                @keyframes pulseMarker {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(49,130,246,0.3); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(49,130,246,0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(49,130,246,0); }
                }
                
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -10px);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }
            `}</style>

            {/* 가상 출발지 설정 알림 배너 */}
            {showVirtualAlert && (
                <div style={{
                    position: 'absolute',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '85%',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#1e293b',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    zIndex: 3000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    border: '1.5px solid #e2e8f0',
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeInDown 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#3182f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            💡 가상 위치 설정 안내
                        </span>
                        <button 
                            onClick={() => setShowVirtualAlert(false)}
                            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px' }}
                        >
                            ×
                        </button>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: '1.5', wordBreak: 'keep-all' }}>
                        현재 계신 위치가 목적지({selectedCity})에서 100km 이상 멀리 떨어져 있어, 원활한 동선 가이드를 위해 가상 출발지(<strong>{startPlaceName}</strong>)로 자동 설정되었습니다.
                    </p>
                </div>
            )}

            {/* 탑바 */}
            <div className="jm-top-bar" style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 10, display: 'flex', justifyContent: 'space-between', padding: '16px 20px' }}>
                <button className="jm-circle-btn" onClick={onBack} title="뒤로가기">
                    <ChevronLeft size={24} />
                </button>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.85)', padding: '6px 12px', borderRadius: '20px', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isLocating ? '위치 탐색 중...' : userLocation?.isVirtual ? '🔌 플래닝 모드' : '📍 실시간 현지 안내'}
                </div>
                
                {/* 삼선 드롭다운 버튼 컨테이너 */}
                <div style={{ position: 'relative' }}>
                    <button className="jm-circle-btn" onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)} title="메뉴">
                        <Menu size={20} />
                    </button>
                    
                    {isMenuDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '52px',
                            width: '180px',
                            maxHeight: '340px',
                            overflowY: 'auto',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0',
                            backdropFilter: 'blur(10px)',
                            padding: '8px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 100
                        }}>
                            <button 
                                onClick={() => {
                                    setIsMenuDropdownOpen(false);
                                    if (isAirportMode) {
                                        setIsAirportMode(false);
                                    } else {
                                        setCurrentStepIndex(prev => prev + 1);
                                    }
                                }}
                                disabled={isAirportMode || currentStepIndex >= placesList.length - 1}
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: (isAirportMode || currentStepIndex >= placesList.length - 1) ? '#cbd5e1' : '#1e293b',
                                    background: 'none',
                                    border: 'none',
                                    cursor: (isAirportMode || currentStepIndex >= placesList.length - 1) ? 'default' : 'pointer',
                                    borderBottom: '1px solid #f1f5f9'
                                }}
                            >
                                🗺️ 다음 경로 안내
                            </button>
                            <button 
                                onClick={() => {
                                    setIsMenuDropdownOpen(false);
                                    if (isAirportMode) {
                                        setIsAirportMode(false);
                                        setCurrentStepIndex(placesList.length - 2);
                                    } else {
                                        setCurrentStepIndex(prev => prev - 1);
                                    }
                                }}
                                disabled={!isAirportMode && currentStepIndex === -1}
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: (!isAirportMode && currentStepIndex === -1) ? '#cbd5e1' : '#1e293b',
                                    background: 'none',
                                    border: 'none',
                                    cursor: (!isAirportMode && currentStepIndex === -1) ? 'default' : 'pointer',
                                    borderBottom: '1px solid #f1f5f9'
                                }}
                            >
                                ↩️ 이전 경로 안내
                            </button>
                            <button 
                                onClick={() => {
                                    setIsMenuDropdownOpen(false);
                                    setIsAirportMode(true);
                                }}
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#8c52ff',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f1f5f9'
                                }}
                            >
                                ✈️ 공항으로 안내
                            </button>
                            <button 
                                onClick={() => {
                                    setIsMenuDropdownOpen(false);
                                    setCurrentStepIndex(-1);
                                    setIsAirportMode(false);
                                }}
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#ff4757',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderBottom: daysList.length > 1 ? '1.5px solid #cbd5e1' : 'none'
                                }}
                            >
                                🔄 경로 초기화
                            </button>

                            {/* 💡 1박 2일 이상 다중 일정인 경우 일자 선택 항목 목록 표시 */}
                            {daysList.length > 1 && (
                                <>
                                    <div style={{ padding: '8px 16px 4px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        일자별 경로 보기
                                    </div>
                                    {daysList.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setIsMenuDropdownOpen(false);
                                                setCurrentDayIndex(index);
                                                setCurrentStepIndex(-1);
                                                setIsAirportMode(false);
                                            }}
                                            style={{
                                                padding: '10px 16px',
                                                textAlign: 'left',
                                                fontSize: '12.5px',
                                                fontWeight: currentDayIndex === index ? 800 : 500,
                                                color: currentDayIndex === index ? '#8c52ff' : '#64748b',
                                                background: currentDayIndex === index ? 'rgba(140, 82, 255, 0.08)' : 'none',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            📅 {index + 1}일차 경로 안내
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 지도 영역 (Leaflet 연동) */}
            <div className="jm-map-area" style={{ background: '#eaf1fa' }}>
                <div id="jm-leaflet-map" style={{ width: '100%', height: '100%', zIndex: 1 }}></div>
                
                {isLocating && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(234, 241, 250, 0.8)',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            border: '4px solid #3182f6',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                            지도를 준비하는 중입니다...
                        </span>
                    </div>
                )}
            </div>

            {/* 하단 정보 플로팅 바 */}
            <div className="jm-float-msg" style={{ transition: 'all 0.3s', border: routeMode === 'transit' ? '1.5px solid #8c52ff' : 'none', zIndex: 5 }}>
                {routeMode === 'walking' ? (
                    <>
                        <MapPin size={16} color="#3182f6" fill="#3182f6" /> 목적지까지 도보 {walkTime}분 ({distance.toFixed(1)}km)
                    </>
                ) : (
                    <>
                        <Bus size={16} color="#8c52ff" /> 대중교통 이용 시 약 {transitTime}분 ({distance.toFixed(1)}km)
                    </>
                )}
            </div>

            {/* 바텀 시트 */}
            <div className="jm-bottom-sheet" style={{ padding: '20px', minHeight: '210px', zIndex: 5 }}>
                <div className="jm-sheet-subtitle" style={{ fontSize: '13px', color: '#8c52ff', fontWeight: 700 }}>
                    {isAirportMode 
                        ? `${currentDayIndex + 1}일차 경로 (공항 이동)` 
                        : `${currentDayIndex + 1}일차 경로 (${Math.max(1, currentStepIndex + 2)}단계)`}
                </div>
                <div className="jm-sheet-title" style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 8px 0' }}>{destPoint.name}</div>
                <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.4', margin: '0 0 16px 0', wordBreak: 'keep-all' }}>
                    {destPoint.reason}
                </p>

                <div className="jm-btn-row">
                    <button className="jm-btn-main" onClick={handleGoClick}>가자</button>
                    <div style={{ width: '70px', flexShrink: 0 }}></div>
                    <button className="jm-btn-sub" onClick={handleAlternativeClick}>
                        {routeMode === 'walking' ? '대중교통 길' : '도보 길'}
                    </button>
                </div>
            </div>

            {/* AI 중앙 스타 버튼 */}
            <div className="jm-ai-center-btn" style={{ zIndex: 10 }}>
                <button 
                    className={`jm-ai-star-btn ${isAiMenuOpen ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleAiMenu();
                    }}
                >
                    <Star size={24} color="white" fill="white" />
                </button>
            </div>
        </div>
    );
}
