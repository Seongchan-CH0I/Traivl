"use client";

import React from 'react';

export default function ProfilePage() {
  // 취향 데이터 예시
  const stats = [
    { label: "문화", value: 90 },
    { label: "음식", value: 60 },
    { label: "예산", value: 40 },
    { label: "휴식", value: 30 },
    { label: "호텔", value: 55 },
    { label: "활동", value: 70 },
  ];

  return (
    <div className="flex flex-col items-center p-6 min-h-screen bg-white">
      {/* 상단 프로필 섹션 */}
      <div className="mt-8 mb-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center shadow-lg">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
               <span className="text-3xl">👤</span>
            </div>
          </div>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-slate-800">나의 여행 DNA</h1>
      <p className="text-slate-400 text-sm mt-1 mb-8">개인화된 여행 프로필</p>

      {/* DNA 분석 결과 배너 */}
      <div className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 rounded-3xl p-8 shadow-xl text-center relative overflow-hidden mb-12">
        <span className="absolute top-4 left-6 text-white text-[10px] flex items-center gap-1 opacity-80">
          ⚡ DNA 분석 결과
        </span>
        <h2 className="text-white text-3xl font-black my-4 tracking-tighter">"전통 탐험가"</h2>
        <div className="flex justify-center gap-2 mt-4">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full border border-white/30">#문화중심</span>
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full border border-white/30">#빡빡한일정</span>
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full border border-white/30">#가성비맛집</span>
        </div>
      </div>

      {/* 취향 분석 그래프 영역 */}
      <div className="w-full max-w-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-8">취향 분석 그래프</h3>
        
        {/* 방사형 그래프 (SVG로 간단히 구현) */}
        <div className="relative w-full aspect-square flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            {/* 배경 육각형 그리드 */}
            <div className="w-full h-full border border-slate-400 rounded-full scale-100" />
            <div className="absolute w-full h-full border border-slate-400 rounded-full scale-75" />
            <div className="absolute w-full h-full border border-slate-400 rounded-full scale-50" />
          </div>
          
          {/* 레이블 배치 */}
          <div className="absolute top-0 font-bold text-slate-600 text-sm">문화</div>
          <div className="absolute top-[25%] right-0 font-bold text-slate-600 text-sm">음식</div>
          <div className="absolute bottom-[25%] right-0 font-bold text-slate-600 text-sm">예산</div>
          <div className="absolute bottom-0 font-bold text-slate-600 text-sm">휴식</div>
          <div className="absolute bottom-[25%] left-0 font-bold text-slate-600 text-sm">호텔</div>
          <div className="absolute top-[25%] left-0 font-bold text-slate-600 text-sm">활동</div>

          {/* 파란색 데이터 영역 (시각적 효과) */}
          <div className="w-48 h-48 bg-indigo-500/20 border-2 border-indigo-500 rounded-full flex items-center justify-center" 
               style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}>
            <div className="w-full h-full bg-indigo-500/30" />
          </div>
        </div>
      </div>
    </div>
  );
}