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

export default function HomePage() {
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);

    const handleCompleteSurvey = () => {
        setIsSurveyOpen(false);
        setHasCompletedSurvey(true);
    };

    if (hasCompletedSurvey) {
        return (
            <main className="home-page pb-safe relative">
                <Header title="어디로 떠나볼까요?" />
                <RecommendCities />
                <RecommendPlaces city="교토" />
                <KyotoRestaurants />
                <FloatingButton />
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
