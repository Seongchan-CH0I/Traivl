import { useEffect, useState } from 'react';
import { Flame, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Place } from '../../types/place';
import PlaceDetailModal from '../ui/PlaceDetailModal';

interface HotPlacesProps {
    isExpanded?: boolean;
    onToggle?: () => void;
}

export default function HotPlaces({ isExpanded, onToggle }: HotPlacesProps) {
    const [places, setPlaces] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    useEffect(() => {
        // Top 12
        fetch('/api/places?limit=12')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    console.log("Fetched places:", res.data); // Debugging
                    setPlaces(res.data);
                }
            })
            .catch(err => console.error("Failed to fetch hot places", err))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-[#8c52ff]" size={32} />
            </div>
        );
    }

    const top3 = places.slice(0, 3);
    const rest = places.slice(3, 12);

    // 3개씩 묶기 함수
    const chunkArray = (arr: Place[], size: number) => {
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    };

    const restChunks = chunkArray(rest, 3);

    return (
        <>
            <section className={`hot-places-section px-2 mt-8 transition-all duration-500 ${isExpanded ? 'translate-y-[-20px]' : ''}`}>
                <div className="flex items-center justify-between mb-[48px] pr-1">
                    <h2 className="section-title mb-0">지금 핫한 여행지 Top 12 <Flame className="flame-icon" /></h2>
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-full bg-[#8c52ff] text-white hover:bg-[#7a41ea] shadow-md transition-all flex items-center justify-center transform active:scale-90"
                        aria-label={isExpanded ? "축소하기" : "펼치기"}
                    >
                        {isExpanded ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
                    </button>
                </div>

                {/* 1~3위 가로 리스트강조 */}
                <div className={`hot-list-container ${isExpanded ? 'mb-14' : 'mb-[48px]'}`}>
                    {top3.map((place, index) => (
                        <div
                            key={place.id}
                            className="hot-list-item top-rank cursor-pointer active:scale-[0.98] transition-transform"
                            onClick={() => setSelectedPlace({ ...place, rank: index + 1 })}
                        >
                            <div className="rank-badge">{index + 1}</div>
                            <div className="image-wrapper">
                                <img src={place.imageUrl || "/images/placeholder.jpg"} alt={place.name} />
                            </div>
                            <div className="info">
                                <div className="location-tag">{place.destination?.name.split(',')[0]}</div>
                                <h3>{place.name}</h3>
                                <p className="description">{place.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 안내 멘트 개선 : 애니메이션 효과, 시인성 강화 */}
                {!isExpanded && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 bg-[#f8f5ff] rounded-2xl border border-[#e5d9ff] mb-20">
                        <p className="text-[13px] text-[#554475] font-medium text-center break-keep leading-relaxed">
                            실시간 핫한 여행지를 더 확인하고 싶으시면<br />
                            <span className="text-[#8c52ff] font-bold text-[14px]">오른쪽 상단의 보라색 버튼을</span>눌러주세요 </p>
                    </div>
                )}

                {/* 4~12위 확장 시에만 조건부 렌더링 (레이아웃 공간 차지 방지 */}
                {isExpanded && (
                    <div className="hot-grid-container px-1 mb-1 transition-all duration-500 animate-in fade-in duration-300">
                        {restChunks.map((chunk, chunkIndex) => (
                            <div key={chunkIndex} className="hot-grid-row">
                                {chunk.map((place, itemIndex) => {
                                    const rank = 4 + chunkIndex * 3 + itemIndex;
                                    return (
                                        <div
                                            key={place.id}
                                            className="hot-grid-item cursor-pointer active:scale-[0.98] transition-transform"
                                            onClick={() => setSelectedPlace({ ...place, rank: rank })}
                                        >
                                            <div className="grid-image-wrapper">
                                                <img src={place.imageUrl || "/images/placeholder.jpg"} alt={place.name} />
                                                <div className="grid-rank-badge">{rank}</div>
                                            </div>
                                            <div className="grid-info">
                                                <div className="grid-location">{place.destination?.name.split(',')[0]}</div>
                                                <h4 className="grid-title">{place.name}</h4>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}

                {!places.length && <p className="p-5 text-gray-400 text-center">데이터가 없습니다.</p>}

            </section>

            <PlaceDetailModal 
                place={selectedPlace} 
                onClose={() => setSelectedPlace(null)} 
            />
        </>
    );
}
