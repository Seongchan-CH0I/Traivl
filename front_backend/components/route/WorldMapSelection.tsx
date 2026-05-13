"use client";

import React, { useState } from 'react';

interface WorldMapSelectionProps {
    selectedContinent: string;
    onSelect: (continent: string) => void;
}

const WorldMapSelection: React.FC<WorldMapSelectionProps> = ({ selectedContinent, onSelect }) => {
    const [hovered, setHovered] = useState<string | null>(null);

    // Enlarged and repositioned Continent Paths
    const continents = [
        { 
            id: '아시아', 
            name: 'Asia', 
            path: "M600,100 L750,120 L880,180 L920,350 L800,450 L650,400 L580,250 Z",
            color: "#4ade80" 
        },
        { 
            id: '유럽', 
            name: 'Europe', 
            path: "M450,100 L580,80 L650,100 L620,250 L500,280 L420,220 Z", 
            color: "#60a5fa" 
        },
        { 
            id: '북미', 
            name: 'North America', 
            path: "M50,50 L380,40 L450,220 L350,320 L120,300 Z", 
            color: "#f87171" 
        },
        { 
            id: '남미', 
            name: 'South America', 
            path: "M320,320 L450,350 L420,550 L320,580 L280,450 Z", 
            color: "#fbbf24" 
        },
        { 
            id: '아프리카', 
            name: 'Africa', 
            path: "M480,280 L620,300 L680,480 L580,580 L450,520 L420,380 Z", 
            color: "#f472b6" 
        },
        { 
            id: '오세아니아', 
            name: 'Oceania', 
            path: "M750,450 L920,480 L950,580 L800,595 L720,550 Z", 
            color: "#a78bfa" 
        }
    ];

    return (
        <div className="world-map-container">
            <svg viewBox="0 0 1000 650" className="world-map-svg">
                {/* Continent Paths */}
                {continents.map((cont) => (
                    <path
                        key={cont.id}
                        d={cont.path}
                        fill={selectedContinent === cont.id ? cont.color : (hovered === cont.id ? `${cont.color}44` : "#f1f5f9")}
                        stroke={selectedContinent === cont.id ? cont.color : "#cbd5e1"}
                        strokeWidth={selectedContinent === cont.id ? 4 : 1.5}
                        className="continent-path"
                        onMouseEnter={() => setHovered(cont.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => onSelect(cont.id)}
                        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    />
                ))}

                {/* Larger Labels */}
                {continents.map((cont) => {
                    // Adjusted centers for enlarged paths
                    const centers: Record<string, [number, number]> = {
                        '북미': [230, 160],
                        '남미': [360, 440],
                        '유럽': [530, 170],
                        '아프리카': [560, 420],
                        '아시아': [760, 260],
                        '오세아니아': [830, 530]
                    };
                    const [x, y] = centers[cont.id];
                    const isSelected = selectedContinent === cont.id;
                    return (
                        <g key={`label-${cont.id}`} pointerEvents="none">
                            <circle cx={x} cy={y} r={6} fill={isSelected ? "white" : cont.color} stroke={isSelected ? cont.color : "none"} strokeWidth={2} />
                            <text 
                                x={x} 
                                y={y + 30} 
                                textAnchor="middle" 
                                fontSize="18" 
                                fontWeight="800"
                                fill={isSelected ? "#111" : "#64748b"}
                                style={{ textShadow: isSelected ? 'none' : '0 1px 2px rgba(255,255,255,0.8)' }}
                            >
                                {cont.id}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <div className="map-feedback">
                {selectedContinent ? (
                    <div className="feedback-item selected">
                        <span className="dot" style={{ backgroundColor: continents.find(c => c.id === selectedContinent)?.color }}></span>
                        <strong>{selectedContinent}</strong>를 선택하였습니다.
                    </div>
                ) : (
                    <div className="feedback-item placeholder">
                        지도의 대륙을 클릭해 보세요.
                    </div>
                )}
            </div>

            <style jsx>{`
                .world-map-container {
                    width: 100%;
                    padding: 0 10px;
                }
                .world-map-svg {
                    width: 100%;
                    height: auto;
                    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.05));
                }
                .continent-path:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                }
                .map-feedback {
                    margin: 40px 20px 0;
                    padding: 24px;
                    background: #ffffff;
                    border-radius: 20px;
                    text-align: center;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
                }
                .feedback-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 15px;
                    color: #475569;
                }
                .feedback-item.selected {
                    color: var(--primary-color);
                    font-weight: 600;
                }
                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .placeholder {
                    color: #94a3b8;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default WorldMapSelection;
