"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { RefreshCcw } from 'lucide-react';
import Header from '../components/ui/Header';
import FloatingButton from '../components/ui/FloatingButton';
import Banner from '../components/home/Banner';
import PopularCities from '../components/home/PopularCities';
import HotPlaces from '../components/home/HotPlaces';

import DynamicPlaces from '../components/home/DynamicPlaces';
import DynamicRestaurants from '../components/home/DynamicRestaurants';
import SurveyModal from '../components/survey/SurveyModal';
import RouteCreationModal from '../components/route/RouteCreationModal';
import JourneyMap from '../components/route/JourneyMap';

import { useAi } from '../context/AiContext';
import { useSearchParams, useRouter } from 'next/navigation';

export default function HomePage() {
    const { user } = useAuth(); // 사용자 정보 가져오기
    const { setHasActiveJourney, setSelectedCity, dnaResult, setDnaResult } = useAi();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isJourneyStarted, setIsJourneyStarted] = useState(false);

    // ✅ 설문 완료 여부를 전역 상태인 dnaResult 유무로 판단! (중요)
    const hasCompletedSurvey = !!dnaResult;

    // URL 파라미터 체크하여 설문 트리거
    useEffect(() => {
        const trigger = searchParams.get('trigger');
        if (trigger === 'survey') {
            setIsSurveyOpen(true);
        }
    }, [searchParams]);

    // 유저 정보가 확인되면 DB에서 기존 설문 결과 조회해오기 (이미 전역 데이터가 있으면 생략)
    useEffect(() => {
        if (user?.id && !dnaResult) { // 데이터가 없을 때만 fetch
            fetch(`/api/survey?userId=${user.id}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success && res.data) {
                        setDnaResult(res.data);
                    }
                })
                .catch(err => console.error("Failed to fetch user DNA", err));
        }
    }, [user, dnaResult, setDnaResult]);

    const handleCompleteSurvey = (resultData: any) => { 
        if (resultData && !Array.isArray(resultData)) {
            setDnaResult(resultData); // 전역 상태 업데이트 -> UI 자동으로 hasCompletedSurvey=true 됨
        }
        setIsSurveyOpen(false);
    };

    const handleResetSurvey = async () => {
        if (!user?.id) return;
        
        try {
            const res = await fetch(`/api/survey?userId=${user.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            
            if (data.success) {
                setDnaResult(null); // 전역 값 초기화 -> UI 자동으로 Banner 화면으로 바뀜
                setHasActiveJourney(false);
                setSelectedCity(null);
                setIsSurveyOpen(false);
            }
        } catch (err) {
            console.error("Failed to reset survey:", err);
        }
    };

    const handleStartJourney = (city: string) => {
        setIsRouteModalOpen(false);
        setIsJourneyStarted(true);
        setHasActiveJourney(true);
        setSelectedCity(city);
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
                <button 
                    onClick={handleResetSurvey} 
                    className="absolute top-8 right-5 z-20 p-2 text-gray-400 hover:text-[#8c52ff] transition-colors"
                    title="데이터 초기화 (개발용)"
                >
                    <RefreshCcw size={20} />
                </button>

                {/* ✅ 설문 결과 렌더링 영역 (전역 dnaResult 사용) */}
                {dnaResult && (
                    <div className="mx-5 mt-8 mb-14 bg-white rounded-[24px] p-7 text-center border border-[#f0f2f5] shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden flex flex-col items-center">
                        {/* 더 화려하고 은은한 배경 효과 (Glassmorphism 느낌의 blur) */}
                        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/60 rounded-full blur-[40px] pointer-events-none"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/60 rounded-full blur-[40px] pointer-events-none"></div>

                        <div className="relative z-10 w-full">
                            <span className="inline-block px-4 py-1.5 mb-4 text-[13px] font-bold text-white bg-gradient-to-r from-blue-500 to-[#8c52ff] rounded-full shadow-md">
                                ✈️ 당신의 여행 DNA
                            </span>

                            <h2 className="text-[26px] font-extrabold text-gray-900 mb-3 leading-tight tracking-tight">
                                {dnaResult.dnaType}
                            </h2>

                            <p className="text-[14.5px] text-gray-600 mb-7 leading-relaxed break-keep px-2">
                                {dnaResult.description}
                            </p>

                            <div className="w-full relative h-[250px] mb-6 overflow-hidden rounded-[20px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] cursor-pointer group">
                                <img
                                    src={dnaResult.imageUrl}
                                    alt={dnaResult.name}
                                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100"></div>
                                <div className="absolute bottom-0 left-0 w-full p-5 text-left transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                                    <p className="text-white/80 text-[13px] font-medium mb-1 drop-shadow-sm">최적의 목적지</p>
                                    <h3 className="text-white font-bold text-[22px] drop-shadow-md">
                                        {dnaResult.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2.5 justify-center mt-2">
                                {dnaResult.tags?.map((tag: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1.5 text-[13px] font-semibold text-[#8c52ff] bg-[#f8f5ff] border border-[#eaddff] rounded-full hover:bg-[#f0e6ff] transition-colors">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            {/* ✅ 다시 검사하기 버튼 추가 */}
                            <button
                                onClick={handleResetSurvey}
                                className="mt-8 px-6 py-2.5 text-[14px] font-semibold text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-sm w-full"
                            >
                                🔄 여행 성향 다시 검사하기
                            </button>
                        </div>
                    </div>
                )}


                <DynamicPlaces 
                    destinationId={dnaResult?.id || 'JP_KYOTO'} 
                    cityName={dnaResult?.name?.split(',')[0] || '교토'} 
                />
                <DynamicRestaurants 
                    destinationId={dnaResult?.id || 'JP_KYOTO'} 
                    cityName={dnaResult?.name?.split(',')[0] || '교토'} 
                />
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
            <button 
                onClick={handleResetSurvey} 
                className="absolute top-8 right-5 z-20 p-2 text-gray-400 hover:text-[#8c52ff] transition-colors"
                title="데이터 초기화 (개발용)"
            >
                <RefreshCcw size={20} />
            </button>
            <Banner onStart={() => setIsSurveyOpen(true)} />
            <PopularCities />
            <HotPlaces />
        </main>
    );
}
