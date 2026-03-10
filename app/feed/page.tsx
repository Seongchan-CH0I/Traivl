"use client";

import React from 'react';
import { Home, LayoutGrid, Sparkles, Calendar, User, Plane, Flame, Star, Lightbulb, PartyPopper, X } from 'lucide-react';

const TravelApp = () => {
  const guides = [
    { id: 1, title: "경복궁", desc: "지금 방문하면 한복 대여 할인이 있어요", img: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?q=80&w=800", badge: "여유로움" },
    { id: 2, title: "명동교자", desc: "진한 칼국수 국물이 정말 일품이에요", img: "https://images.unsplash.com/photo-1534422298391-e4f8c170db06?q=80&w=800", rating: "4.5" },
    { id: 3, title: "대중교통 환승 팁", desc: "기후동행카드 사용 가능", img: "https://images.unsplash.com/photo-1517604931442-7e0c8ed0963c?q=80&w=800" },
    { id: 4, title: "한강 공원", desc: "반포한강공원 무지개분수", img: "https://images.unsplash.com/photo-1540914124281-3427106e74f9?q=80&w=800", rating: "4.5" }
  ];

  return (
    /* id="tailwind-feed"를 통해 내부 Tailwind 클래스에 우선순위를 부여합니다. */
    <div id="tailwind-feed" className="max-w-[430px] mx-auto bg-white min-h-screen pb-32 relative font-sans text-slate-900 overflow-x-hidden">
      
      {/* --- Header --- */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-md sticky top-0 z-20 border-b border-slate-50">
        <h1 className="text-[20px] font-bold tracking-tight text-slate-900 m-0">여행 실시간 가이드</h1>
        <div className="flex items-center bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
          <span className="text-[11px] font-bold mr-1">내 여행지</span>
          <Plane size={12} className="rotate-45 mr-1" />
          <X size={14} className="cursor-pointer" />
        </div>
      </header>

      {/* --- Filter Tabs --- */}
      <div className="flex gap-2 px-6 py-3 overflow-x-auto no-scrollbar bg-white">
        <button className="bg-indigo-500 text-white px-5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap shadow-md shadow-indigo-100 border-none">전체</button>
        {[
          { icon: <Flame size={13} className="text-orange-500" />, label: "인기" },
          { icon: <Star size={13} className="text-yellow-500 fill-yellow-500" />, label: "리뷰" },
          { icon: <Lightbulb size={13} className="text-amber-500" />, label: "팁" },
          { icon: <PartyPopper size={13} className="text-blue-500" />, label: "이벤트" }
        ].map((tab, idx) => (
          <button key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap">
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* --- Main Content (Cards) --- */}
      <main className="px-5 py-4 space-y-4">
        {guides.map((item) => (
          <div key={item.id} className="group relative w-full h-[160px] rounded-[20px] overflow-hidden shadow-sm transition-all active:scale-[0.98]">
            <img src={item.img} alt={item.title} className="w-full h-full object-cover block" />
            {/* 더 어두운 오버레이로 텍스트 가독성 확보 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {item.badge && (
                <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> {item.badge}
                </div>
              )}
            </div>
            {item.rating && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <Star size={10} className="fill-yellow-400 text-yellow-400" /> {item.rating}
              </div>
            )}

            {/* Bottom Text Info */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-[17px] font-bold text-white mb-0.5 drop-shadow-sm leading-tight">{item.title}</h2>
              <p className="text-white/80 text-[12px] font-medium leading-tight m-0">
                {item.id === 3 && <span className="mr-1">⏱️</span>}
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </main>

      {/* --- Bottom Navigation --- */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-xl border-t border-slate-100 px-8 py-3 flex justify-between items-end z-50 rounded-t-[24px]">
        <NavItem icon={<Home size={22} />} label="홈" active />
        <NavItem icon={<LayoutGrid size={22} />} label="피드" />
        
        <div className="relative flex flex-col items-center pb-1">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-3.5 rounded-full shadow-lg border-4 border-white mb-1">
            <Sparkles size={24} className="text-white fill-white/20" />
          </div>
          <span className="text-[10px] font-bold text-indigo-600">AI 가이드</span>
        </div>

        <NavItem icon={<Calendar size={22} />} label="내 일정" />
        <NavItem icon={<User size={22} />} label="내 정보" />
      </nav>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        /* 기존 CSS 초기화 간섭 방지 */
        #tailwind-feed * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${active ? 'text-indigo-600' : 'text-slate-300'}`}>
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </div>
);

export default TravelApp;