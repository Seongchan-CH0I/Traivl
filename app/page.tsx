"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/ui/Header';
import FloatingButton from '../components/ui/FloatingButton';
import Banner from '../components/home/Banner';
import PopularCities from '../components/home/PopularCities';
import HotPlaces from '../components/home/HotPlaces';
import RecommendCities from '../components/home/RecommendCities';
import KyotoRecommendPlaces from '../components/home/KyotoRecommendPlaces';
import KyotoRestaurants from '../components/home/KyotoRestaurants';
import SurveyModal from '../components/survey/SurveyModal';
import RouteCreationModal from '../components/route/RouteCreationModal';
import JourneyMap from '../components/route/JourneyMap';
import RecommendPlaces from '../components/home/KyotoRecommendPlaces';

export default function HomePage() {
    const { user } = useAuth(); // 사용자 정보 가져오기
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isJourneyStarted, setIsJourneyStarted] = useState(false);
    const [surveyResult, setSurveyResult] = useState<any>(null); // ✅ 결과 저장용 State 추가

    // 유저 정보가 확인되면 DB에서 기존 설문 결과 조회해오기
    useEffect(() => {
        if (user?.id) {
            fetch(`/api/survey?userId=${user.id}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success && res.data) {
                        setSurveyResult(res.data);
                        setHasCompletedSurvey(true);
                    }
                })
                .catch(err => console.error("Failed to fetch user DNA", err));
        }
    }, [user]);

    const handleCompleteSurvey = (resultData: any) => { // 데이터를 받아오게 수정!
        if (resultData && !Array.isArray(resultData)) {
            setSurveyResult(resultData);  // 받아온 정보 저장
        }
        setIsSurveyOpen(false);
        setHasCompletedSurvey(true);
    };

    const handleStartJourney = () => {
        setIsRouteModalOpen(false);
        setIsJourneyStarted(true);
    };

    if (isJourneyStarted) {
        return <JourneyMap onBack={() => setIsJourneyStarted(false)} />;
    }

    if (hasCompletedSurvey) {
        return (
            <main className="home-page pb-safe relative">
                <SurveyModal
                    isOpen={isSurveyOpen}
                    onClose={() => setIsSurveyOpen(false)}
                    onComplete={handleCompleteSurvey}
                />
                <RouteCreationModal
                    isOpen={isRouteModalOpen}
                    onClose={() => setIsRouteModalOpen(false)}
                    onStartJourney={handleStartJourney}
                />
                <Header title="어디로 떠나볼까요?" />

                {/* ✅ 설문 결과 렌더링 영역 */}
                {surveyResult && (
                    <div className="mx-5 mt-8 mb-14 bg-white rounded-[24px] p-7 text-center border border-[#f0f2f5] shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden flex flex-col items-center">
                        {/* 더 화려하고 은은한 배경 효과 (Glassmorphism 느낌의 blur) */}
                        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/60 rounded-full blur-[40px] pointer-events-none"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/60 rounded-full blur-[40px] pointer-events-none"></div>

                        <div className="relative z-10 w-full">
                            <span className="inline-block px-4 py-1.5 mb-4 text-[13px] font-bold text-white bg-gradient-to-r from-blue-500 to-[#8c52ff] rounded-full shadow-md">
                                ✈️ 당신의 여행 DNA
                            </span>

                            <h2 className="text-[26px] font-extrabold text-gray-900 mb-3 leading-tight tracking-tight">
                                {surveyResult.dnaType}
                            </h2>

                            <p className="text-[14.5px] text-gray-600 mb-7 leading-relaxed break-keep px-2">
                                {surveyResult.description}
                            </p>

                            <div className="w-full relative h-[250px] mb-6 overflow-hidden rounded-[20px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] cursor-pointer group">
                                <img
                                    src={surveyResult.imageUrl}
                                    alt={surveyResult.name}
                                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100"></div>
                                <div className="absolute bottom-0 left-0 w-full p-5 text-left transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                                    <p className="text-white/80 text-[13px] font-medium mb-1 drop-shadow-sm">최적의 목적지</p>
                                    <h3 className="text-white font-bold text-[22px] drop-shadow-md">
                                        {surveyResult.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2.5 justify-center mt-2">
                                {surveyResult.tags?.map((tag: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1.5 text-[13px] font-semibold text-[#8c52ff] bg-[#f8f5ff] border border-[#eaddff] rounded-full hover:bg-[#f0e6ff] transition-colors">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            {/* ✅ 다시 검사하기 버튼 추가 */}
                            <button
                                onClick={() => setIsSurveyOpen(true)}
                                className="mt-8 px-6 py-2.5 text-[14px] font-semibold text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-sm w-full"
                            >
                                🔄 여행 성향 다시 검사하기
                            </button>
                        </div>
                    </div>
                )}

                <RecommendCities />
                <RecommendPlaces city="교토" />
                <KyotoRestaurants />
                <FloatingButton onClick={() => setIsRouteModalOpen(true)} />
            </main>
        );
    }

    return (
        <main className="home-page relative">
            <SurveyModal
                isOpen={isSurveyOpen}
                onClose={() => setIsSurveyOpen(false)}
                onComplete={handleCompleteSurvey}
            />
            <Header title="어디로 떠나볼까요?" />
            <Banner onStart={() => setIsSurveyOpen(true)} />
            <PopularCities />
            <HotPlaces />
        </main>
    );
}
