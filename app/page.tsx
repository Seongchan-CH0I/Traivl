"use client";

import { useState } from 'react';
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

export default function HomePage() {
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isJourneyStarted, setIsJourneyStarted] = useState(false);

    const handleCompleteSurvey = () => {
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
                <RecommendCities />
                <KyotoRecommendPlaces city="교토" />
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
