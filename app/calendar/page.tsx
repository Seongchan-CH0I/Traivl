"use client";

import React, { useState } from 'react';
import { Clock, RotateCcw, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const schedules = [
    { id: 1, time: "10:00", location: "경복궁", category: "관광", description: "한복 체험 및 수문장 교대식 관람", icon: "⛩️", duration: "2시간" },
    { id: 2, time: "13:00", location: "명동교자 본점", category: "식사", description: "점심 식사 (칼국수와 만두)", icon: "🍜", duration: "1시간" },
    { id: 3, time: "15:30", location: "N서울타워", category: "랜드마크", description: "케이블카 탑승 및 서울 전경 관람", icon: "🗼", duration: "1.5시간" },
  ];

  return (
    /* 핵심 1: tailwind.config.ts에서 설정한 ID를 여기에 부여 */
    /* 핵심 2: 기존 global.css의 틀인 app-container를 함께 사용 */
    <div id="tailwind-feed" className="app-container">
      
      {/* 핵심 3: 기존 global.css의 content 영역 안에 배치하되, 
          새 디자인을 위해 배경색 등에 ! (important) 사용 */}
      <div className="content !bg-[#F9FBFF] p-6 !pb-32">
        
        {/* 상단 헤더 */}
        <div className="mt-4 mb-10">
          <h1 className="text-3xl font-black !text-slate-900 tracking-tight">나의 여행 일정</h1>
          <p className="!text-slate-400 text-[15px] mt-2 font-medium">AI가 추천하는 최적의 경로</p>
        </div>

        {/* 다른 루트 추천 버튼 */}
        <button 
          onClick={handleRefresh}
          className="flex items-center justify-center gap-3 w-full py-4 mb-10 !bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-slate-100 !text-slate-700 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <RotateCcw size={18} className={`text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
          다른 루트 추천
        </button>

        {/* 타임라인 리스트 */}
        <div className="relative space-y-10 before:absolute before:inset-0 before:left-[17px] before:w-[2px] before:bg-slate-100">
          {schedules.map((item) => (
            <div key={item.id} className="relative pl-12 group">
              {/* 타임라인 원형 포인트 */}
              <div className="absolute left-0 top-1 w-[36px] h-[36px] rounded-full !bg-white border-2 border-indigo-500 flex items-center justify-center z-10 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>

              {/* 시간 표시 */}
              <div className="absolute -left-1 top-11 text-[13px] font-black !text-slate-800 tracking-tighter">
                {item.time}
              </div>

              {/* 일정 카드 */}
              <div className="!bg-white rounded-[32px] p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.04)] border border-slate-50/50 flex items-start gap-5 transition-all group-hover:translate-x-1">
                <div className="flex-shrink-0 w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                  {item.icon}
                </div>

                <div className="flex-1 text-left">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-[19px] font-bold !text-slate-900 tracking-tight">
                      {item.location}
                    </h3>
                    <ChevronRight size={18} className="text-slate-300 mt-1" />
                  </div>
                  <p className="text-sm !text-slate-500 leading-snug mb-4 font-medium">
                    {item.description}
                  </p>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 px-3 py-1 bg-indigo-50 !text-indigo-600 rounded-full text-[11px] font-bold">
                      <Clock size={12} /> {item.duration}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 !text-slate-500 rounded-full text-[11px] font-bold">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <button className="fixed bottom-10 right-8 w-16 h-16 !bg-slate-900 !text-white rounded-[24px] shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
        <span className="text-3xl font-light">+</span>
      </button>
    </div>
  );
}