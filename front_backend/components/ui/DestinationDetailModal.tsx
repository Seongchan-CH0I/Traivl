'use client';

import React from 'react';
import { X, Globe, DollarSign, Zap, FileText, Calendar, TrendingUp } from 'lucide-react';

interface DestinationDetailModalProps {
    destination: {
        id: string;
        name: string;
        dnaType: string;
        description: string;
        imageUrl: string;
        currency?: string;
        language?: string;
        voltage?: string;
        visaRequired?: string;
        bestSeason?: string[];
        averageCost?: number;
        costRationale?: string;
    } | null;
    onClose: () => void;
}

const DestinationDetailModal: React.FC<DestinationDetailModalProps> = ({ destination, onClose }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragInfo = React.useRef({ isDragging: false, startY: 0, scrollTop: 0 });

    if (!destination) return null;

    // 계절별 이모지 매핑
    const seasonEmojis: Record<string, string> = {
        "봄": "🌸",
        "여름": "🌊",
        "가을": "🍁",
        "겨울": "❄️",
        "초여름": "🍃"
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;

        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;

        dragInfo.current = {
            isDragging: true,
            startY: e.pageY,
            scrollTop: container.scrollTop
        };
        container.style.cursor = 'grabbing';
        container.style.userSelect = 'none';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragInfo.current.isDragging) return;
        const container = containerRef.current;
        if (!container) return;

        const deltaY = e.pageY - dragInfo.current.startY;
        container.scrollTop = dragInfo.current.scrollTop - deltaY;
    };

    const handleMouseUpOrLeave = () => {
        if (!dragInfo.current.isDragging) return;
        dragInfo.current.isDragging = false;
        
        const container = containerRef.current;
        if (container) {
            container.style.cursor = 'grab';
            container.style.removeProperty('user-select');
        }
    };

    return (
        <div className="place-modal-overlay" onClick={onClose}>
            <div 
                ref={containerRef}
                className="place-modal-content relative max-w-[400px] w-full max-h-[85vh] overflow-y-auto" 
                onClick={(e) => e.stopPropagation()}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                style={{ cursor: 'grab', overflowY: 'auto', maxHeight: '85vh', maxWidth: '400px' }}
            >
                <button className="close-modal-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-hero h-[220px]">
                    <img
                        src={destination.imageUrl}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="modal-rank-tag">
                        {destination.dnaType}
                    </div>
                </div>

                <div className="modal-body p-5 pb-10">
                    <div className="!mb-4">
                        <div className="modal-location-tag mb-1">
                            {destination.id.split('_')[0] === 'JP' ? '🇯🇵 일본' : '🇰🇷 한국'}
                        </div>
                        <h2 className="modal-title">
                            {destination.name}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 !gap-3 !mb-4">
                        <div className="flex items-center gap-3 !p-3.5 bg-gray-50 rounded-[15px] border border-gray-100">
                            <DollarSign size={16} className="text-blue-500" />
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">통화</p>
                                <p className="text-[13px] font-bold text-gray-800">{destination.currency || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 !p-4 bg-gray-50 rounded-[15px] border border-gray-100">
                            <Globe size={16} className="text-purple-500" />
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">언어</p>
                                <p className="text-[13px] font-bold text-gray-800">{destination.language || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 !p-4 bg-gray-50 rounded-[15px] border border-gray-100">
                            <Zap size={16} className="text-orange-500" />
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">전압</p>
                                <p className="text-[13px] font-bold text-gray-800">{destination.voltage || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 !p-4 bg-gray-50 rounded-[15px] border border-gray-100">
                            <FileText size={16} className="text-green-500" />
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">비자</p>
                                <p className="text-[13px] font-bold text-gray-800">{destination.visaRequired || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="!space-y-3">
                        <div className="!p-3.5 bg-[#f8f5ff] rounded-[18px] border border-[#eaddff] flex flex-col items-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Calendar size={18} className="text-[#8c52ff]" />
                                <span className="text-base font-bold text-[#333]">추천 여행 계절</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {destination.bestSeason?.map((season, idx) => (
                                    <span key={idx} className="px-6 py-2.5 bg-white text-[15px] font-bold text-gray-700 rounded-full border border-[#eaddff] shadow-sm">
                                        {season} {seasonEmojis[season] || ''}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="!p-3.5 bg-white rounded-[18px] border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className="text-gray-700" />
                                    <h4 className="font-bold text-[14px] text-gray-800">현지 물가 수준</h4>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <div 
                                            key={star} 
                                            className={`w-3.5 h-3.5 rounded-full ${star <= (destination.averageCost || 0) ? 'bg-yellow-400' : 'bg-gray-200'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-[13px] text-gray-600 leading-relaxed break-keep">
                                {destination.costRationale}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DestinationDetailModal;
