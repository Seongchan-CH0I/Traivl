"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type TranslationState = 'idle' | 'camera' | 'result' | 'audio_idle' | 'audio_recording' | 'audio_result' | 'ai_chat';

interface AiContextType {
    isAiMenuOpen: boolean;
    setIsAiMenuOpen: (open: boolean) => void;
    isJourneyMapMode: boolean;
    setIsJourneyMapMode: (mode: boolean) => void;
    translationState: TranslationState;
    setTranslationState: (state: TranslationState) => void;
    toggleAiMenu: () => void;
    closeAll: () => void;
    hasActiveJourney: boolean;
    setHasActiveJourney: (active: boolean) => void;
    selectedCity: string | null;
    setSelectedCity: (city: string | null) => void;
    dnaResult: any; // 설문 데이터 보관
    setDnaResult: (result: any) => void;
    itineraryData: any; // AI 일정 데이터 보관
    setItineraryData: (itinerary: any) => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export function AiProvider({ children }: { children: ReactNode }) {
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const [isJourneyMapMode, setIsJourneyMapMode] = useState(false);
    const [translationState, setTranslationState] = useState<TranslationState>('idle');
    const [hasActiveJourney, setHasActiveJourney] = useState(false);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [dnaResult, setDnaResult] = useState<any>(null);
    const [itineraryData, setItineraryData] = useState<any>(null);

    const toggleAiMenu = () => setIsAiMenuOpen(!isAiMenuOpen);
    const closeAll = () => {
        setIsAiMenuOpen(false);
        setTranslationState('idle');
    };

    return (
        <AiContext.Provider value={{
            isAiMenuOpen,
            setIsAiMenuOpen,
            isJourneyMapMode,
            setIsJourneyMapMode,
            translationState,
            setTranslationState,
            toggleAiMenu,
            closeAll,
            hasActiveJourney,
            setHasActiveJourney,
            selectedCity,
            setSelectedCity,
            dnaResult,
            setDnaResult,
            itineraryData,
            setItineraryData
        }}>
            {children}
        </AiContext.Provider>
    );
}

export function useAi() {
    const context = useContext(AiContext);
    if (context === undefined) {
        throw new Error('useAi must be used within an AiProvider');
    }
    return context;
}
