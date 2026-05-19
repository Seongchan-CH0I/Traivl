"use client";

import { X, MapPin, Clock, Phone, Star, Lightbulb, PartyPopper, CreditCard, Ticket, Info, Sparkles } from 'lucide-react';
import { Place } from '../../types/place';

interface PlaceDetailModalProps {
    place: Place | null;
    onClose: () => void;
}

const getPlaceCategory = (place: Place) => {
    if (place.rank === 11) return '팁';
    if (place.rank === 12) return '이벤트';
    
    const text = (place.name + (place.description || '')).toLowerCase();
    if (text.includes('팁') || text.includes('패스') || text.includes('교통') || text.includes('방법') || text.includes('할인') || text.includes('이용권') || text.includes('가이드')) return '팁';
    if (text.includes('축제') || text.includes('행사') || text.includes('이벤트') || text.includes('시즌') || text.includes('개막') || text.includes('분수') || text.includes('공연') || text.includes('전시') || text.includes('마켓') || text.includes('벚꽃') || text.includes('불꽃') || text.includes('단풍') || text.includes('팝업') || text.includes('야간')) return '이벤트';
    
    return '일반';
};

const getScopeOfApplicability = (address: string) => {
    const addr = address.toLowerCase();
    if (addr.includes('seoul')) return '서울 및 수도권 대중교통망 전역';
    if (addr.includes('jeju')) return '제주도 전역 및 주요 렌터카 운영 구역';
    if (addr.includes('sokcho')) return '설악산 국립공원 및 속초 주요 등반 코스';
    if (addr.includes('osaka')) return '오사카 시내 및 근교 대중교통/관광지 전역';
    if (addr.includes('kyoto')) return '교토 시내 버스 노선 및 주요 역사 사찰 구역';
    if (addr.includes('tokyo')) return '도쿄 도심 지하철 노선 및 주요 랜드마크';
    if (addr.includes('fukuoka')) return '후쿠오카 도심 순환 노선 및 주요 야경 거점';
    if (addr.includes('okinawa')) return '오키나와 본섬 주요 해안 도로 및 중남부 관광지';
    if (addr.includes('paris')) return '파리 1-2존 메트로 노선 및 시내 박물관 전역';
    if (addr.includes('barcelona')) return '바르셀로나 시내 중심가 및 주요 가우디 건축물군';
    if (addr.includes('rome')) return '로마 유적지 지구 및 대중교통 노선';
    if (addr.includes('berlin')) return '베를린 시내 AB존 대중교통 및 박물관 섬 지구';
    return `${address.split(',')[0]} 시내 및 주변 주요 관광 구역`;
};

const getEventViewingTip = (name: string) => {
    const title = name.toLowerCase();
    if (title.includes('경복궁')) return '사전 온라인 티켓 예매 필수 / 야간 특별 공연 포함';
    if (title.includes('영화제')) return '개막식 레드카펫 사전 예매 필수 / 야외 극장 상영 추천';
    if (title.includes('시장')) return '주말 혼잡 시간대 웨이팅 발생 / 카드 및 간편결제 가능';
    if (title.includes('단풍')) return '단풍 피크 시즌 주말 도로 정체 심함 / 이른 아침 등반 권장';
    if (title.includes('텐진')) return '불꽃놀이 명당 조기 마감 / 대중교통 이용 적극 권장';
    if (title.includes('벚꽃')) return '만개 시기 혼잡 / 수로변을 따라 걷는 아침 도보 코스 추천';
    if (title.includes('시부야')) return '일몰 전후 시간대 예약 치열 / 옥상 야외 전망대 강풍 주의';
    if (title.includes('하카타')) return '이른 아침 시간대 메인 경주 진행 / 주요 도로 차량 통제 확인';
    if (title.includes('불꽃쇼')) return '해변 돗자리 사전 준비 권장 / 행사 당일 행사장 주변 교통 정체';
    if (title.includes('에펠탑')) return '매시 정각 5분 동안 점등 진행 / 트로카데로 광장이 최고의 뷰포인트';
    if (title.includes('분수')) return '계절별 운영 요일 및 개시 시간 상이 / 현지 기상 상황 확인 필요';
    if (title.includes('바티칸')) return '주간보다 한산하고 여유로운 관람 환경 / 사전 야간 투어 예약 필수';
    if (title.includes('빛의 축제') || title.includes('lights')) return '도시 전역의 랜드마크 도보 투어 코스 추천 / 가을철 야간 보온 대비';
    return '시즌 한정 스페셜 이벤트 / 사전 예약 및 현장 기상 상태 확인 권장';
};

export default function PlaceDetailModal({ place, onClose }: PlaceDetailModalProps) {
    if (!place) return null;

    const cat = getPlaceCategory(place);

    return (
        <div 
            className="place-modal-overlay" 
            onClick={onClose}
        >
            <div 
                className="place-modal-content" 
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    className="close-modal-btn" 
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                <div className="modal-hero">
                    <img src={place.imageUrl || "/images/placeholder.jpg"} alt={place.name} />
                </div>

                <div className="modal-body">
                    <div className="modal-header-row">
                        <div className="flex items-center gap-2">
                            <div className="modal-location-tag">
                                {place.destination?.name.split(',')[0] || place.address?.split(',')[0]}
                            </div>
                            {cat === '팁' && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-[#ff9800] bg-[#fff8e1] px-2 py-0.5 rounded-full border border-[#ffe082]">
                                    <Lightbulb size={12} fill="#ff9800" color="#ff9800" /> 꿀팁 가이드
                                </span>
                            )}
                            {cat === '이벤트' && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-[#2196f3] bg-[#e3f2fd] px-2 py-0.5 rounded-full border border-[#bbdefb]">
                                    <PartyPopper size={12} color="#2196f3" /> 특별 행사
                                </span>
                            )}
                        </div>
                        {place.rating && (
                            <div className="modal-rating">
                                <Star size={14} fill="#FFD700" color="#FFD700" />
                                <span>{place.rating}</span>
                            </div>
                        )}
                    </div>
                    <h2 className="modal-title">{place.name}</h2>

                    {place.tags && place.tags.length > 0 && (
                        <div className="modal-tags-container">
                            {place.tags.map((tag, i) => (
                                <span key={i} className="modal-tag-chip">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="modal-divider"></div>
                    <p className="modal-description">
                        {place.description}
                    </p>

                    <div className="modal-meta-list">
                        {place.address && (
                            <div className="modal-meta-item">
                                <MapPin size={16} className="meta-icon" />
                                <span>
                                    {cat === '팁' ? '적용/구매 위치: ' : cat === '이벤트' ? '축제 개최지: ' : ''}
                                    {place.address}
                                </span>
                            </div>
                        )}
                        
                        {/* 꿀팁 전용 적용 범위 */}
                        {cat === '팁' && (
                            <div className="modal-meta-item">
                                <Info size={16} className="meta-icon" style={{ color: '#ff9800' }} />
                                <span>
                                    <strong className="font-semibold text-[#ff9800]">정보 적용 범위: </strong>
                                    {getScopeOfApplicability(place.address || '')}
                                </span>
                            </div>
                        )}

                        {/* 이벤트 전용 관람/참여 꿀팁 */}
                        {cat === '이벤트' && (
                            <div className="modal-meta-item">
                                <Sparkles size={16} className="meta-icon" style={{ color: '#2196f3' }} />
                                <span>
                                    <strong className="font-semibold text-[#2196f3]">관람/참여 꿀팁: </strong>
                                    {getEventViewingTip(place.name || '')}
                                </span>
                            </div>
                        )}

                        {/* 일반 맛집/관광지 전용 위도/경도 */}
                        {cat === '일반' && place.latitude && place.longitude && (
                            <div className="modal-meta-item">
                                <MapPin size={16} className="meta-icon" />
                                <span>위도/경도: {place.latitude}, {place.longitude}</span>
                            </div>
                        )}

                        {place.openingHours && (
                            <div className="modal-meta-item">
                                <Clock size={16} className="meta-icon" />
                                <span>
                                    {cat === '팁' ? '이용 가능 시간: ' : cat === '이벤트' ? '행사 운영 시간: ' : '영업시간: '}
                                    {place.openingHours}
                                </span>
                            </div>
                        )}
                        {place.phoneNumber && (
                            <div className="modal-meta-item">
                                <Phone size={16} className="meta-icon" />
                                <span>{place.phoneNumber}</span>
                            </div>
                        )}
                        
                        {/* 꿀팁 전용 요금 정보 */}
                        {cat === '팁' && (
                            <div className="modal-meta-item">
                                <CreditCard size={16} className="meta-icon" style={{ color: '#ff9800' }} />
                                <span>
                                    이용 준비 비용: {place.averagePrice && place.averagePrice > 0 ? `${place.averagePrice.toLocaleString()}원` : '비용 없음 (무료 정보)'}
                                </span>
                            </div>
                        )}
                        
                        {/* 이벤트 전용 티켓 정보 */}
                        {cat === '이벤트' && (
                            <div className="modal-meta-item">
                                <Ticket size={16} className="meta-icon" style={{ color: '#2196f3' }} />
                                <span>
                                    티켓/입장 비용: {place.averagePrice && place.averagePrice > 0 ? `${place.averagePrice.toLocaleString()}원` : '무료 관람 (자유 입장)'}
                                </span>
                            </div>
                        )}
                        
                        {/* 일반 맛집/관광지 평균 예산 노출 */}
                        {cat === '일반' && place.averagePrice !== undefined && place.averagePrice !== null && (
                            <div className="modal-meta-item">
                                <CreditCard size={16} className="meta-icon" />
                                <span>
                                    평균 예산: {place.averagePrice > 0 ? `${place.averagePrice.toLocaleString()}원` : '무료'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
