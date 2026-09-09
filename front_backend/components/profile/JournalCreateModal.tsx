"use client";

import React, { useState } from 'react';
import { X, Sparkles, Loader2, BookOpen, MapPin } from 'lucide-react';
import { useBackHandler } from '../../hooks/useBackHandler';

interface JournalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSchedules: any[];
  userId: string;
  dnaType?: string;
  onSuccess: (newJournal: any) => void;
}

export default function JournalCreateModal({
  isOpen,
  onClose,
  savedSchedules,
  userId,
  dnaType,
  onSuccess
}: JournalCreateModalProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const { safeClose } = useBackHandler(isOpen, onClose, 'journal_create_modal');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const selectedSchedule = savedSchedules.find(s => s.id === selectedScheduleId);

      // 1. AI 정보 생성 호출
      const aiRes = await fetch('/api/journals/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedSchedule ? `${selectedSchedule.city} 여행 추억` : '즐거웠던 여행 기록',
          city: selectedSchedule ? selectedSchedule.city : '추억의 여행지',
          itineraryData: selectedSchedule?.itineraryData,
          userNotes,
          dnaType
        })
      });

      const aiData = await aiRes.json();
      if (!aiData.success) throw new Error(aiData.message);

      const generated = aiData.data;

      // 2. DB 또는 서버에 저장
      const saveRes = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          scheduleId: selectedScheduleId || null,
          title: generated.title,
          city: generated.city,
          coverImage: generated.coverImage,
          content: generated.content,
          highlights: generated.highlights,
          mood: generated.mood,
          rating: generated.rating,
          aiSummary: generated.aiSummary,
          journalData: generated.journalData
        })
      });

      const saveResult = await saveRes.json();
      if (saveResult.success) {
        onSuccess(saveResult.data);
        safeClose();
      }
    } catch (err) {
      console.error("Failed to create journal:", err);
      alert("여행일지 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f3eeff', color: '#8c52ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>✨ AI 여행일지 생성</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>다녀온 여행을 AI가 감동적인 기록으로 복기해 드립니다</p>
            </div>
          </div>

          <button onClick={safeClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* 일정 선택 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>
            1. 연관된 일정 선택 (선택 사항)
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1.5px solid #e2e8f0',
              fontSize: '13.5px',
              color: '#0f172a',
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          >
            <option value="">일정 선택 안함 (기본 여행 생성)</option>
            {savedSchedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                📍 {schedule.title} ({schedule.city})
              </option>
            ))}
          </select>
        </div>

        {/* 한줄 메모 및 감상 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>
            2. 특별했던 순간이나 메모 (선택 사항)
          </label>
          <textarea
            placeholder="예: 맛있는 라멘집에 다녀왔고, 바다 노을이 인상 깊었어요."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            rows={3}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1.5px solid #e2e8f0',
              fontSize: '13px',
              color: '#0f172a',
              outline: 'none',
              backgroundColor: '#f8fafc',
              resize: 'none'
            }}
          />
        </div>

        {/* AI 생성 실행 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: '#8c52ff',
            color: 'white',
            fontSize: '14px',
            fontWeight: 800,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(140, 82, 255, 0.35)'
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              AI가 여행을 정리하고 추억을 복기하는 중...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              AI 여행일지 & 추억회상 생성하기
            </>
          )}
        </button>
      </div>
    </div>
  );
}
