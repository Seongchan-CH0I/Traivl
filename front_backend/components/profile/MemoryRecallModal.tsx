"use client";

import React, { useState } from 'react';
import { X, Calendar, MapPin, Star, Download, Share2, Sparkles, Heart, Compass, CheckCircle2, Bookmark, Loader2, Award } from 'lucide-react';
import { useBackHandler } from '../../hooks/useBackHandler';

interface MemoryRecallModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: any;
  userName?: string;
}

// [사용자 메모]: xxx [AI 여행 정리]: yyy 파싱 함수
const parseJournalContent = (rawContent: string) => {
  if (!rawContent) return { userMemo: '', aiSummaryText: '' };
  
  let userMemo = '';
  let aiSummaryText = rawContent;

  if (rawContent.includes('[사용자 메모]:')) {
    const parts = rawContent.split('[AI 여행 정리]:');
    const memoPart = parts[0].replace('[사용자 메모]:', '').trim();
    userMemo = memoPart;
    aiSummaryText = parts[1] ? parts[1].trim() : '';
  }

  return { userMemo, aiSummaryText };
};

export default function MemoryRecallModal({
  isOpen,
  onClose,
  journal,
  userName = "트래블러"
}: MemoryRecallModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'journal' | 'recall'>('recall');
  const [isDownloading, setIsDownloading] = useState(false);

  // 메모 작성 및 타임라인 편집 상태
  const [editableUserMemo, setEditableUserMemo] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableDailyMemories, setEditableDailyMemories] = useState<any[]>([]);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  // 모바일 뒤로가기 동기화 훅
  const { safeClose } = useBackHandler(isOpen, onClose, 'memory_recall_modal');

  // 모달이 열릴 때 선택된 journal 데이터를 파싱하여 미리 채움
  React.useEffect(() => {
    if (journal) {
      const { userMemo } = parseJournalContent(journal.content || '');
      setEditableUserMemo(userMemo || (journal.content?.includes('[사용자 메모]:') ? '' : journal.content) || '');

      const rawDaily = journal.journalData?.dailyMemories || [];
      const city = journal.city || '여행지';
      const formattedDaily = rawDaily.map((item: any, idx: number) => {
        let placesStr = item.places;
        if (!placesStr || placesStr === '📍 → →' || placesStr.includes('undefined')) {
          if (city.includes('교토') || city.includes('일본')) {
            placesStr = idx === 0 ? "청수사 → 산넨자카 → 니넨자카" : "아라시야마 대나무 숲 → 텐류지";
          } else if (city.includes('제주')) {
            placesStr = idx === 0 ? "함덕 해수욕장 → 카페 서우봉" : "성산일출봉 → 섭지코지 → 로컬 맛집";
          } else {
            placesStr = `${city} 주요 명소 → 로컬 맛집`;
          }
        }
        return {
          day: item.day || idx + 1,
          theme: item.theme || `DAY ${idx + 1} 여정`,
          places: placesStr,
          memo: item.memo || item.aiHighlight || '날씨와 이동 동선이 완벽했던 날입니다.'
        };
      });
      setEditableDailyMemories(formattedDaily);
    }
  }, [journal]);

  if (!isOpen || !journal) return null;

  const { userMemo: currentParsedMemo, aiSummaryText } = parseJournalContent(journal.content || '');

  const handleDownloadCard = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const cardElement = document.getElementById('sns-memory-card-snapshot');
      if (cardElement) {
        const canvas = await html2canvas(cardElement, {
          useCORS: true,
          allowTaint: true,
          scale: 3, // 초고화질 SNS용
          backgroundColor: null,
          logging: false
        });

        const link = document.createElement('a');
        link.download = `${userName}_${journal.city || 'Travel'}_Memory_Card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (err) {
      console.error("Memory card download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const journalData = journal.journalData || {};
  const dailyMemories = journalData.dailyMemories || [
    { day: 1, theme: '여정의 시작', places: '주요 명소 방문 및 탐색', memo: 'AI 추천 코스로 편리하게 이동하며 멋진 풍경을 즐겼습니다.' },
    { day: 2, theme: '현지 로컬 체험', places: '맛집 및 문화 스팟', memo: '현지 분위기와 맛있는 음식들이 잊지 못할 추억이 되었습니다.' }
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={safeClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInUp 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 커버 영역 */}
        <div 
          style={{
            position: 'relative',
            height: '180px',
            backgroundImage: `url(${journal.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 20px'
          }}
        >
          {/* 어두운 그래디언트 오버레이 */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(15,23,42,0.85) 100%)'
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              📸 지난 여행 복기 카드
            </span>

            <button
              onClick={safeClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', backgroundColor: '#8c52ff', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                {journal.mood || '🌿 힐링'}
              </span>
              <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Star size={13} fill="#fbbf24" /> {journal.rating || 5.0}
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
              {journal.title}
            </h2>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#a855f7" /> {journal.city} • {journal.createdAt ? new Date(journal.createdAt).toLocaleDateString() : '최근 여행'}
            </p>
          </div>
        </div>

        {/* 탭 3종 서브 메뉴 (여행 정리 -> 여행일지 -> 추억회상) */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('recall')}
            style={{
              flex: 1,
              padding: '12px 6px',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              backgroundColor: activeTab === 'recall' ? '#ffffff' : 'transparent',
              color: activeTab === 'recall' ? '#8c52ff' : '#64748b',
              borderBottom: activeTab === 'recall' ? '2.5px solid #8c52ff' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={14} />
            추억 회상
          </button>
          
          <button
            onClick={() => setActiveTab('journal')}
            style={{
              flex: 1,
              padding: '12px 6px',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              backgroundColor: activeTab === 'journal' ? '#ffffff' : 'transparent',
              color: activeTab === 'journal' ? '#8c52ff' : '#64748b',
              borderBottom: activeTab === 'journal' ? '2.5px solid #8c52ff' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <Bookmark size={14} />
            여행 일지
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            style={{
              flex: 1,
              padding: '12px 6px',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              backgroundColor: activeTab === 'summary' ? '#ffffff' : 'transparent',
              color: activeTab === 'summary' ? '#8c52ff' : '#64748b',
              borderBottom: activeTab === 'summary' ? '2.5px solid #8c52ff' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <Award size={14} />
            여행 정리
          </button>
        </div>

        {/* 바디 컨텐츠 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB 1: 추억 회상 (Memory Recall) */}
          {activeTab === 'recall' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* AI 총평 하이라이트 박스 */}
              <div 
                style={{
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #ddd6fe'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                  <Sparkles size={16} />
                  <span>AI 에이전트의 추억 복기 한줄평</span>
                </div>
                <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                  "{journal.aiSummary || `${journal.city}에서 보낸 소중한 여행 기록입니다. AI 가이드와 함께 완성하여 더욱 뜻깊은 추억으로 남았습니다.`}"
                </p>
              </div>

              {/* SNS 카드 프리뷰 메인 (html2canvas 캡처 대상) */}
              <div 
                id="sns-memory-card-snapshot"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                  borderRadius: '20px',
                  padding: '20px',
                  color: 'white',
                  position: 'relative',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  overflow: 'hidden'
                }}
              >
                {/* 배경 장식 동그라미 */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(140,82,255,0.15)', filter: 'blur(20px)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc', letterSpacing: '0.1em' }}>
                    TRAIVL MEMORY SNAPSHOT
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                    ver. 2026
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img 
                    src={journal.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'} 
                    alt="Memory Cover" 
                    style={{ width: '70px', height: '70px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'white', margin: 0 }}>{journal.title}</h3>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '3px', margin: 0 }}>📍 {journal.city} 여행의 추억</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <span style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', color: '#e9d5ff' }}>
                        DNA 일치율 98%
                      </span>
                      <span style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', color: '#e9d5ff' }}>
                        {journal.mood || '🌿 힐링'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ margin: '14px 0 10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.15)', fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                  "{journal.content ? journal.content.substring(0, 100) + '...' : `${journal.city}에서 보낸 최고의 힐링 순간들!`}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: 'rgba(255,255,255,0.6)' }}>
                  <span>HOLDER: {userName}</span>
                  <span>TRAIVL AGENT CERTIFIED ✨</span>
                </div>
              </div>

              {/* 다운로드 버튼 */}
              <button
                onClick={handleDownloadCard}
                disabled={isDownloading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: '#8c52ff',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(140, 82, 255, 0.3)'
                }}
              >
                {isDownloading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                추억 스냅샷 카드 갤러리에 저장 (SNS 공유용)
              </button>

              {/* 키워드 태그들 */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  🏷️ 핵심 추억 키워드
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(journal.highlights || ['#힐링여행', '#AI에이전트', '#완벽코스', '#성공적']).map((tag: string, i: number) => (
                    <span 
                      key={i} 
                      style={{ 
                        fontSize: '12px', 
                        backgroundColor: '#f1f5f9', 
                        color: '#475569', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontWeight: 700 
                      }}
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 여행 일지 (Travel Journal Timeline) */}
          {activeTab === 'journal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 사용자 메모 & AI 여행 정리 분리 영역 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. 사용자 직접 작성 메모 블록 */}
                <div style={{ background: '#f5f3ff', padding: '14px', borderRadius: '14px', border: '1.5px solid #ddd6fe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✍️ 나만의 추억 메모 (직접 작성)
                    </strong>
                    <button 
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                      style={{ fontSize: '11.5px', color: '#8c52ff', background: '#ffffff', border: '1px solid #c084fc', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {isEditingNotes ? '저장 💾' : '메모 수정 ✏️'}
                    </button>
                  </div>

                  {isEditingNotes ? (
                    <textarea
                      value={editableUserMemo}
                      onChange={(e) => setEditableUserMemo(e.target.value)}
                      placeholder="여행 중 느꼈던 감상이나 기분을 적어보세요."
                      rows={3}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #8c52ff', fontSize: '12.5px', marginTop: '4px', outline: 'none', backgroundColor: '#ffffff' }}
                    />
                  ) : (
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5', fontWeight: 600 }}>
                      {editableUserMemo || "직접 작성한 메모가 없습니다. '메모 수정' 버튼을 눌러 소중한 기억을 적어보세요!"}
                    </p>
                  )}
                </div>

                {/* 2. AI 여행 정리 블록 */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>
                    🤖 AI 에이전트 종합 코스 정리
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: '1.6' }}>
                    {aiSummaryText || `${journal.city}에서의 여정은 성향에 맞는 무리 없는 동선과 감성 스팟 탐방이 연동된 완벽한 여행이었습니다.`}
                  </p>
                </div>
              </div>

              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                🗓️ 일자별 타임라인 일지
              </span>

              {/* 일자별 타임라인 스팟 & 수정 기능 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                {editableDailyMemories.map((item: any, index: number) => {
                  const isEditingThisDay = editingDayIndex === index;
                  return (
                    <div 
                      key={index} 
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '14px',
                        borderRadius: '14px',
                        border: '1px solid #f1f5f9',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div 
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#f3eeff',
                          color: '#8c52ff',
                          fontWeight: 900,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        D{item.day || index + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {item.theme || `DAY ${item.day || index + 1} 여정`}
                          </h4>
                          <button
                            onClick={() => setEditingDayIndex(isEditingThisDay ? null : index)}
                            style={{ fontSize: '11px', color: '#8c52ff', background: '#f3eeff', border: 'none', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            {isEditingThisDay ? '완료 💾' : '수정 ✏️'}
                          </button>
                        </div>

                        {isEditingThisDay ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>방문 장소 경로:</label>
                            <input
                              type="text"
                              value={item.places}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditableDailyMemories(prev => prev.map((d, i) => i === index ? { ...d, places: val } : d));
                              }}
                              placeholder="예: 청수사 → 산넨자카 → 기온 거리"
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1.5px solid #8c52ff', fontSize: '12px', outline: 'none' }}
                            />
                            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>일자별 감상 메모:</label>
                            <input
                              type="text"
                              value={item.memo}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditableDailyMemories(prev => prev.map((d, i) => i === index ? { ...d, memo: val } : d));
                              }}
                              placeholder="예: 단풍이 너무 예뻤던 최고의 날!"
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1.5px solid #8c52ff', fontSize: '12px', outline: 'none' }}
                            />
                          </div>
                        ) : (
                          <>
                            <p style={{ fontSize: '12px', color: '#8c52ff', fontWeight: 700, margin: '4px 0 4px 0' }}>
                              📍 {item.places || '주요 명소 탐방'}
                            </p>
                            <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                              {item.memo || item.aiHighlight || '날씨와 현지 이동 동선이 완벽했습니다.'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 여행 정리 (Travel Summary) */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>방문 스팟 수</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#8c52ff', marginTop: '2px' }}>
                    {journalData.visitedSpotsCount || 8}곳
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>DNA 맞춤도</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                    {journalData.dnaMatchScore || 98}%
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>여행 스타일</span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
                    {journal.mood || '🌿 힐링'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>사용 만족도</span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Star size={14} fill="#f59e0b" /> {journal.rating || 5.0} / 5.0
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯</span> 라이프사이클 마무리 체크
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#10b981', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> ① 전: 여행 성향 분석 및 일정 AI 생성 완료
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#10b981', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> ② 중: 실시간 현지 음성/사진 번역 & 가이드 활성화
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#10b981', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> ③ 후: 여행 정리 & 추억 회상 카드 보관 완료
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
