"use client";

import { useState } from 'react';
import Header from '../components/ui/Header';
import FloatingButton from '../components/ui/FloatingButton';
import Banner from '../components/home/Banner';
import PopularCities from '../components/home/PopularCities';
import HotPlaces from '../components/home/HotPlaces';
import RecommendCities from '../components/home/RecommendCities';
import RecommendPlaces from '../components/home/RecommendPlaces';
import KyotoRestaurants from '../components/home/KyotoRestaurants';
import SurveyModal from '../components/survey/SurveyModal';
import RouteCreationModal from '../components/route/RouteCreationModal';
import JourneyMap from '../components/route/JourneyMap';

export default function HomePage() {
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isJourneyStarted, setIsJourneyStarted] = useState(false);
    const [surveyResult, setSurveyResult] = useState<any>(null); // ✅ 결과 저장용 State 추가

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
                <RouteCreationModal
                    isOpen={isRouteModalOpen}
                    onClose={() => setIsRouteModalOpen(false)}
                    onStartJourney={handleStartJourney}
                />
                <Header title="어디로 떠나볼까요?" />

                {/* ✅ 설문 결과 렌더링 영역 */}
                {surveyResult && (
                    <div className="mx-4 mt-6 mb-8 bg-blue-50/50 rounded-[20px] p-6 text-center border border-blue-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-100/40 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none"></div>

                        <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">
                            ✈️ 당신의 여행 DNA
                        </span>

                        <h2 className="text-[22px] font-bold text-gray-800 mb-2 leading-tight">
                            {surveyResult.dnaType}
                        </h2>

                        <p className="text-[14px] text-gray-600 mb-5 leading-relaxed break-keep">
                            {surveyResult.description}
                        </p>

                        <div className="w-full relative h-[180px] mb-4 overflow-hidden rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                            <img
                                src={surveyResult.imageUrl}
                                alt={surveyResult.name}
                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent">
                                <h3 className="text-white font-bold text-lg text-left">
                                    추천 여행지: {surveyResult.name}
                                </h3>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            {surveyResult.tags?.map((tag: string, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 text-xs font-medium text-blue-800 bg-blue-100/80 rounded-md">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <RecommendCities />
                <RecommendPlaces city={surveyResult ? surveyResult.name.split(',')[0] : "교토"} />
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
