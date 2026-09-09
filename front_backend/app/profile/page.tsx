"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAi } from '../../context/AiContext';
import { Dna, Plus, Download, Map as MapIcon, Share2, Trash2, Loader2, LogOut, X, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';
import CustomAlertModal from '../../components/ui/CustomAlertModal';
import MemoryRecallModal from '../../components/profile/MemoryRecallModal';
import JournalCreateModal from '../../components/profile/JournalCreateModal';
import { useBackHandler } from '../../hooks/useBackHandler';

export default function ProfilePage() {
  const { user, logout, withdraw } = useAuth();
  const { hasActiveJourney, setHasActiveJourney, setItineraryData, setSelectedCity } = useAi();
  
  const [isResetting, setIsResetting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 3D 카드 뒤집기 상태
  const [isFlipped, setIsFlipped] = useState(false);
  
  // 내 저장된 일정 리스트 상태
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

  // html2canvas 다운로드 로딩 상태
  const [isDownloading, setIsDownloading] = useState(false);

  // 여행일지 및 추억 회상 모달 상태
  const [journals, setJournals] = useState<any[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [selectedJournalForRecall, setSelectedJournalForRecall] = useState<any>(null);
  const [isCreateJournalOpen, setIsCreateJournalOpen] = useState(false);

  // CustomAlertModal 상태 관리
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {},
  });

  // 모바일 뒤로가기 동기화 훅
  const { safeClose: closeProfileModal } = useBackHandler(modalConfig.isOpen, () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  }, 'prof_modal');

  const showAlert = (message: string, title?: string, onConfirm?: () => void) => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

  const showConfirm = (message: string, title?: string, onConfirm?: () => void, onCancel?: () => void) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onCancel) onCancel();
      }
    });
  };

  const handleWithdraw = () => {
    if (!user?.id) return;
    showConfirm(
      "정말로 회원 탈퇴를 진행하시겠습니까?\n탈퇴 시 모든 정보와 저장된 일정 데이터가 안전하게 완전히 파기됩니다.",
      "회원 탈퇴 😢",
      async () => {
        setIsWithdrawing(true);
        try {
          const res = await withdraw();
          if (res.success) {
            showAlert(res.message, "탈퇴 완료", () => {
              window.location.href = "/";
            });
          } else {
            showAlert(res.message, "탈퇴 실패");
          }
        } catch (e) {
          showAlert("네트워크 통신 중 오류가 발생했습니다.", "오류");
        } finally {
          setIsWithdrawing(false);
        }
      }
    );
  };
  
  const [profileData, setProfileData] = useState<any>(null);
  const [aiUsageHistory, setAiUsageHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 프로필 및 히스토리 데이터 로드
  const fetchProfileData = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const [profileRes, historyRes] = await Promise.all([
        fetch(`/api/profile/${user.id}`),
        fetch(`/api/profile/${user.id}/history`)
      ]);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setProfileData(profile);
      }
      if (historyRes.ok) {
        const history = await historyRes.json();
        setAiUsageHistory(history);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 내 일정 보관함 데이터 로드
  const fetchSavedSchedules = async () => {
    if (!user?.id) return;
    setSchedulesLoading(true);
    try {
      const res = await fetch(`/api/schedules?userId=${user.id}`);
      const result = await res.json();
      if (result.success) {
        setSavedSchedules(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch saved schedules:", error);
    } finally {
      setSchedulesLoading(false);
    }
  };

  // 3. 여행일지 & 추억 보관함 데이터 로드 (DB + LocalStorage 이중 병합)
  const fetchJournals = async () => {
    setJournalsLoading(true);
    try {
      let dbJournals: any[] = [];
      const queryUserId = user?.id || 'user-1';
      try {
        const res = await fetch(`/api/journals?userId=${queryUserId}`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          dbJournals = result.data;
        }
      } catch (err) {
        console.warn("DB journals fetch failed:", err);
      }

      const localJournals = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('traivl_user_journals') || '[]') : [];

      // DB 및 LocalStorage 결합 및 중복 제거
      const combinedMap = new globalThis.Map<string, any>();
      [...localJournals, ...dbJournals].forEach((j: any) => {
        if (j && j.id) combinedMap.set(j.id, j);
      });

      const combinedList = Array.from(combinedMap.values()).sort((a: any, b: any) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      if (combinedList.length > 0) {
        setJournals(combinedList);
      } else {
        setJournals(defaultDemoJournals);
      }
    } catch (error) {
      console.error("Failed to fetch journals:", error);
      setJournals(defaultDemoJournals);
    } finally {
      setJournalsLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
    if (user?.id) {
      fetchProfileData();
      fetchSavedSchedules();
    }
  }, [user?.id]);

  // 여행 종료 후 내 정보로 넘어왔을 때 추억 회상 모달 자동 팝업
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingJournal = sessionStorage.getItem('auto_open_recall_journal');
      if (pendingJournal) {
        try {
          const parsed = JSON.parse(pendingJournal);
          setSelectedJournalForRecall(parsed);
          sessionStorage.removeItem('auto_open_recall_journal');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleResetDna = () => {
    if (!user?.id) return;
    showConfirm(
      "정말 나의 여행 DNA 결과를 완전히 초기화하시겠습니까? (되돌릴 수 없습니다.)",
      "DNA 결과 초기화 🗑️",
      async () => {
        setIsResetting(true);
        try {
          const res = await fetch(`/api/survey?userId=${user.id}`, { method: 'DELETE' });
          if (res.ok) {
            showAlert("초기화 완료! 앱이 새로고침되어 처음 상태로 돌아갑니다.", "초기화 성공", () => {
              window.location.href = "/";
            });
          } else {
            showAlert("초기화에 실패했습니다.", "오류");
          }
        } catch (e) {
          showAlert("네트워크 통신 중 오류가 발생했습니다.", "오류");
        } finally {
          setIsResetting(false);
        }
      }
    );
  };

  // 3. DNA 카드 이미지 다운로드 기능 (html2canvas)
  const handleDownloadCard = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 뒤집히지 않도록 이벤트 전파 차단
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      // dynamic import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const cardElement = document.getElementById('travel-dna-card-front');
      if (cardElement) {
        const canvas = await html2canvas(cardElement, {
          useCORS: true,
          allowTaint: true,
          scale: 3, // 초고화질 SNS 크기
          backgroundColor: null,
          logging: false
        });

        const link = document.createElement('a');
        link.download = `${user?.name || 'Traveler'}_Travel_DNA.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showAlert("여행 DNA 카드가 갤러리에 다운로드되었습니다! SNS에 자유롭게 공유해보세요. ✨", "다운로드 완료");
      }
    } catch (err) {
      console.error("Card download failed:", err);
      showAlert("이미지 저장 중 오류가 발생했습니다.", "오류");
    } finally {
      setIsDownloading(false);
    }
  };

  // 4. 저장 일정 활성화 (지도로 보기)
  const handleActivateSchedule = (schedule: any) => {
    showConfirm(
      `'${schedule.title}' 일정을 현재 활성 여행으로 등록하시겠습니까?\n달력 및 지도 화면이 이 일정으로 동기화됩니다.`,
      "일정 활성화 🗺️",
      () => {
        setItineraryData(schedule.itineraryData);
        setHasActiveJourney(true);
        showAlert("선택한 일정이 활성화되었습니다! 지도로 바로 이동합니다.", "활성화 완료", () => {
          window.location.href = "/calendar";
        });
      }
    );
  };

  // 4-1. 여행 종료 및 추억 생성 핸들러 (중 -> 후 단계 전환 핵심)
  const handleEndJourney = async (schedule: any) => {
    showConfirm(
      `'${schedule.title}' 여행을 종료하고 '지난 여행일지 & 추억회상'에 등록하시겠습니까?\nAI가 이번 여행 동선을 종합하여 완벽한 추억 카드로 보관해 드립니다.`,
      "여행 종료 및 추억 정리 🏁",
      async () => {
        try {
          setIsLoading(true);
          const aiRes = await fetch('/api/journals/ai-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `${schedule.city} 여행 추억`,
              city: schedule.city,
              itineraryData: schedule.itineraryData,
              dnaType: profileData?.dnaType
            })
          });
          const aiData = await aiRes.json();
          const generated = aiData.data || {};

          const saveRes = await fetch('/api/journals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?.id,
              scheduleId: schedule.id,
              title: generated.title || `${schedule.city} 여행의 추억`,
              city: schedule.city,
              coverImage: generated.coverImage,
              content: generated.content,
              highlights: generated.highlights,
              mood: generated.mood,
              rating: generated.rating || 5.0,
              aiSummary: generated.aiSummary,
              journalData: generated.journalData
            })
          });

          const saveResult = await saveRes.json();
          const journalObj = saveResult.data || {
            id: `journal-${Date.now()}`,
            userId: user?.id,
            scheduleId: schedule.id,
            title: generated.title || `${schedule.city} 여행 추억`,
            city: schedule.city,
            coverImage: generated.coverImage,
            content: generated.content,
            highlights: generated.highlights,
            mood: generated.mood,
            rating: 5.0,
            aiSummary: generated.aiSummary,
            journalData: generated.journalData,
            createdAt: new Date().toISOString()
          };
          
          if (typeof window !== 'undefined') {
            const endedSchedules = JSON.parse(localStorage.getItem('ended_schedule_ids') || '[]');
            if (!endedSchedules.includes(schedule.id)) {
              endedSchedules.push(schedule.id);
              localStorage.setItem('ended_schedule_ids', JSON.stringify(endedSchedules));
            }
            const savedJournals = JSON.parse(localStorage.getItem('traivl_user_journals') || '[]');
            savedJournals.unshift(journalObj);
            localStorage.setItem('traivl_user_journals', JSON.stringify(savedJournals));
          }

          // DB에서 일정 삭제 (활성 일정 파기)
          try {
            await fetch(`/api/schedules?id=${schedule.id}`, { method: 'DELETE' });
            setSavedSchedules(prev => prev.filter(s => s.id !== schedule.id));
          } catch (err) {
            console.warn(err);
          }

          setHasActiveJourney(false);
          setItineraryData(null);
          setSelectedCity(null);
          setJournals(prev => [journalObj, ...prev.filter(j => j.id !== journalObj.id)]);

          showAlert(
            "축하합니다! 여행이 완벽히 종료되었으며 '지난 여행일지 & 추억회상' 보관함에 등록되었습니다.",
            "여행 종료 완료 🏁",
            () => {
              setSelectedJournalForRecall(saveResult.data);
            }
          );
        } catch (e) {
          showAlert("여행 종료 도중 오류가 발생했습니다.", "오류");
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  // 5. 저장 일정 공유 상태 변경
  const handleToggleShare = async (schedule: any) => {
    const nextShared = !schedule.isShared;
    const sharePrompt = nextShared 
      ? "이 일정을 커뮤니티 피드에 공개하시겠습니까?" 
      : "이 일정을 피드에서 비공개로 전환하시겠습니까?";

    showConfirm(
      sharePrompt,
      "공유 상태 변경 🔄",
      async () => {
        try {
          const res = await fetch(`/api/schedules/${schedule.id}/share`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isShared: nextShared,
              shareContent: nextShared ? `${user?.name || '트래블러'}님의 추천 여행 코스!` : ''
            })
          });
          const result = await res.json();
          if (result.success) {
            showAlert(
              nextShared ? "커뮤니티 피드에 일정이 성공적으로 공유되었습니다!" : "피드에서 일정을 내렸습니다.",
              "설정 완료"
            );
            // 로컬 목록 상태 업데이트
            setSavedSchedules(prev => prev.map(item => 
              item.id === schedule.id ? { ...item, isShared: nextShared } : item
            ));
          }
        } catch (e) {
          showAlert("공유 변경 도중 서버 통신 실패", "오류");
        }
      }
    );
  };

  // 6. 저장 일정 개별 및 다중 삭제/선택 핸들러
  const handleToggleSelect = (scheduleId: string) => {
    setSelectedScheduleIds(prev =>
      prev.includes(scheduleId)
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedScheduleIds.length === savedSchedules.length) {
      setSelectedScheduleIds([]);
    } else {
      setSelectedScheduleIds(savedSchedules.map(s => s.id));
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    showConfirm(
      "이 일정을 완전히 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.",
      "일정 삭제 🗑️",
      async () => {
        try {
          const res = await fetch(`/api/schedules?id=${scheduleId}`, {
            method: 'DELETE'
          });
          const result = await res.json();
          if (result.success) {
            showAlert("일정이 성공적으로 삭제되었습니다.", "삭제 완료");
            setSavedSchedules(prev => prev.filter(item => item.id !== scheduleId));
            setSelectedScheduleIds(prev => prev.filter(id => id !== scheduleId));
          }
        } catch (e) {
          showAlert("삭제 중 오류가 발생했습니다.", "오류");
        }
      }
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedScheduleIds.length === 0) return;

    showConfirm(
      `선택한 ${selectedScheduleIds.length}개의 일정을 완전히 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`,
      "일정 일괄 삭제 🗑️",
      async () => {
        try {
          const res = await fetch(`/api/schedules?ids=${selectedScheduleIds.join(',')}`, {
            method: 'DELETE'
          });
          const result = await res.json();
          if (result.success) {
            showAlert(`${selectedScheduleIds.length}개의 일정이 성공적으로 삭제되었습니다.`, "삭제 완료");
            setSavedSchedules(prev => prev.filter(item => !selectedScheduleIds.includes(item.id)));
            setSelectedScheduleIds([]);
          } else {
            showAlert(result.message || "삭제 중 오류가 발생했습니다.", "오류");
          }
        } catch (e) {
          showAlert("삭제 중 네트워크 오류가 발생했습니다.", "오류");
        }
      }
    );
  };

  // AI 활용 기록 삭제 핸들러
  const handleDeleteHistoryItem = async (logId: number) => {
    showConfirm(
      "이 AI 기능 활용 기록을 삭제하시겠습니까?",
      "기록 삭제 🗑️",
      async () => {
        try {
          const res = await fetch(`/api/profile/${user?.id}/history?id=${logId}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            setAiUsageHistory(prev => prev.filter(item => item.id !== logId));
          }
        } catch (e) {
          showAlert("기록 삭제 중 오류가 발생했습니다.", "오류");
        }
      }
    );
  };

  const handleClearAllHistory = async () => {
    if (aiUsageHistory.length === 0) return;
    showConfirm(
      "모든 AI 기능 활용 기록을 완전히 삭제하시겠습니까?",
      "전체 기록 삭제 🧹",
      async () => {
        try {
          const res = await fetch(`/api/profile/${user?.id}/history?clearAll=true`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            setAiUsageHistory([]);
            showAlert("모든 AI 활용 기록이 삭제되었습니다.", "삭제 완료");
          }
        } catch (e) {
          showAlert("기록 삭제 중 오류가 발생했습니다.", "오류");
        }
      }
    );
  };

  // 서버에서 받아온 실제 취향 데이터 (없을 경우 기본값 50)
  const stats = profileData?.dnaStat ? [
    { label: "문화", value: profileData.dnaStat.culture },
    { label: "음식", value: profileData.dnaStat.food },
    { label: "예산", value: profileData.dnaStat.budget },
    { label: "휴식", value: profileData.dnaStat.relax },
    { label: "호텔", value: profileData.dnaStat.hotel },
    { label: "활동", value: profileData.dnaStat.activity },
  ] : [
    { label: "문화", value: 50 },
    { label: "음식", value: 50 },
    { label: "예산", value: 50 },
    { label: "휴식", value: 50 },
    { label: "호텔", value: 50 },
    { label: "활동", value: 50 },
  ];

  // 그래프 계산 로직
  const getPoint = (index: number, value: number, maxR: number = 80) => {
    const r = (value / 100) * maxR;
    // 위쪽(문화)부터 시계 방향으로 60도씩(PI/3) 회전
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const x = 110 + r * Math.cos(angle);
    const y = 110 + r * Math.sin(angle);
    return { x, y };
  };

  const dataPoints = stats.map((stat, i) => {
    const { x, y } = getPoint(i, stat.value);
    return `${x},${y}`;
  }).join(" ");

  const levels = [20, 40, 60, 80, 100];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#888', gap: '12px' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#8c52ff' }} />
        <p style={{ fontWeight: 600 }}>프로필 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // DNA가 없거나 일정이 아예 없을 때 (설문 안한 유저 방어)
  const hasDna = !!profileData?.dnaType;

  if (!hasDna) {
    return (
      <div className="profile-empty-container">
        <header className="profile-empty-header" style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>내 정보</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              style={{
                fontSize: '12px', background: '#ffe4e6', color: '#e11d48',
                border: 'none', padding: '6px 12px', borderRadius: '6px',
                cursor: isWithdrawing ? 'not-allowed' : 'pointer', fontWeight: 'bold'
              }}
            >
              {isWithdrawing ? "탈퇴 중..." : "회원 탈퇴 😢"}
            </button>
            <button
              onClick={() => {
                showConfirm("로그아웃 하시겠습니까?", "로그아웃", () => {
                  logout();
                  window.location.href = "/";
                });
              }}
              style={{
                fontSize: '12px', background: '#f1f5f9', color: '#475569',
                border: 'none', padding: '6px 12px', borderRadius: '6px',
                cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              로그아웃 🚪
            </button>
          </div>
        </header>

        <div className="profile-empty-body">
          <div className="dna-icon-wrapper">
            <div className="dna-glow"></div>
            <Dna size={80} className="dna-icon" />
          </div>
          
          <h2 className="profile-empty-title">
            나의 여행 DNA를<br />
            분석하지 않았습니다
          </h2>
          
          <p className="profile-empty-subtitle">
            {user?.name || "회원"}님의 여행 스타일이 궁금하신가요?<br />
            30초 설문으로 맞춤형 정보를 받아보세요!
          </p>
          
          <Link href="/?trigger=survey" className="dna-start-btn">
            DNA 분석 시작하기 +
          </Link>
        </div>
        <CustomAlertModal {...modalConfig} />
      </div>
    );
  }

  return (
    <div className="profile-content" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 상단 프로필 기본 헤더 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', margin: 0 }}>나의 여행 DNA</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>개인화된 여행 라이프스타일</p>
          </div>
        </div>
        
        {/* 버튼 그룹: 더 넓고 터치하기 편하며 겹치지 않는 모던 탭 스타일 */}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            onClick={handleResetDna}
            disabled={isResetting}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              background: '#ffffff',
              color: '#475569',
              border: '1px solid #e2e8f0',
              padding: '10px 8px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <Trash2 size={13} style={{ color: '#64748b' }} />
            DNA 재검사
          </button>
          <button
            onClick={() => {
              showConfirm("로그아웃 하시겠습니까?", "로그아웃", () => {
                logout();
                window.location.href = "/";
              });
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              padding: '10px 8px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <LogOut size={13} style={{ color: '#475569' }} />
            로그아웃
          </button>
        </div>
      </div>

      {/* 3D 플립 카드 컨테이너 */}
      <div 
        className="dna-card-container"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`dna-card ${isFlipped ? 'flipped' : ''}`}>
          
          {/* 카드 앞면 (SNS 공유용 DNA 정보 시각화) */}
          <div className="dna-card-front" id="travel-dna-card-front">
            <div className="dna-card-deco-circle" />
            <div className="dna-card-deco-circle-bottom" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="dna-card-logo">
                <span>🧬</span> TRAIVL DNA
              </div>
              <div className="dna-card-tagline">
                verified card
              </div>
            </div>

            <div style={{ margin: 'auto 0' }}>
              <span style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8, fontWeight: 700 }}>
                MY TRAVELING STYLE
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 900, marginTop: '6px', lineHeight: '1.2', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
                "{profileData?.dnaType}"
              </h2>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '30px', fontSize: '12px', fontWeight: 700 }}>
                  #성향맞춤
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '30px', fontSize: '12px', fontWeight: 700 }}>
                  #AI_인증
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '30px', fontSize: '12px', fontWeight: 700 }}>
                  #트래블러
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.7, fontWeight: 500 }}>HOLDER</div>
                <div className="dna-card-name">{user?.name || 'TRAIVL USER'}</div>
              </div>
              <button
                onClick={handleDownloadCard}
                disabled={isDownloading}
                style={{
                  background: '#ffffff',
                  color: '#8c52ff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                {isDownloading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                카드 저장
              </button>
            </div>
          </div>

          {/* 카드 뒷면 (육각 취향 그래프 상세 요약) */}
          <div className="dna-card-back" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px dashed #e2e8f0', paddingBottom: '10px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#64748b' }}>📊 세부 취향 스탯</span>
              <button 
                onClick={() => setIsFlipped(false)}
                style={{ background: 'none', border: 'none', color: '#8c52ff', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
              >
                돌아가기 🔄
              </button>
            </div>

            {/* 레이더 차트 SVG */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto 0' }}>
              <svg viewBox="0 0 220 220" style={{ width: '190px', height: '190px' }}>
                {levels.map(level => {
                  const points = stats.map((_, i) => {
                    const { x, y } = getPoint(i, level);
                    return `${x},${y}`;
                  }).join(" ");
                  return (
                    <polygon
                      key={`level-${level}`}
                      points={points}
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                  );
                })}
                {stats.map((_, i) => {
                  const { x, y } = getPoint(i, 100);
                  return (
                    <line
                      key={`axis-${i}`}
                      x1="110"
                      y1="110"
                      x2={x}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1.2"
                    />
                  );
                })}
                <polygon
                  points={dataPoints}
                  fill="rgba(140, 82, 255, 0.25)"
                  stroke="#8c52ff"
                  strokeWidth="2"
                />
                {stats.map((stat, i) => {
                  const { x, y } = getPoint(i, stat.value);
                  return (
                    <circle
                      key={`dot-${i}`}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="#8c52ff"
                    />
                  );
                })}
                {stats.map((stat, i) => {
                  const { x, y } = getPoint(i, 98);
                  return (
                    <text
                      key={`label-${i}`}
                      x={x}
                      y={y}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {stat.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: 'auto' }}>
              카드를 다시 탭하면 앞면을 볼 수 있습니다.
            </div>
          </div>

        </div>
      </div>
      
      <p style={{ textAlign: 'center', fontSize: '12.5px', color: '#94a3b8', margin: '-10px 0 10px 0' }}>
        💡 카드를 터치하면 취향 분석 그래프를 확인할 수 있습니다.
      </p>

      {/* 내 일정 보관함 섹션 */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📦</span> 내 일정 보관함 ({savedSchedules.length})
          </h3>
          {savedSchedules.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={savedSchedules.length > 0 && selectedScheduleIds.length === savedSchedules.length}
                  onChange={handleSelectAll}
                  style={{ width: '15px', height: '15px', accentColor: '#8c52ff', cursor: 'pointer' }}
                />
                전체 선택
              </label>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedScheduleIds.length === 0}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: selectedScheduleIds.length > 0 ? '#ffe4e6' : '#f1f5f9',
                  color: selectedScheduleIds.length > 0 ? '#e11d48' : '#94a3b8',
                  cursor: selectedScheduleIds.length > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Trash2 size={13} />
                선택 삭제{selectedScheduleIds.length > 0 ? ` (${selectedScheduleIds.length})` : ''}
              </button>
            </div>
          )}
        </div>

        {schedulesLoading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#888' }}>
            <Loader2 className="animate-spin" style={{ margin: '0 auto 8px', color: '#8c52ff' }} />
            보관함 일정을 불러오는 중입니다...
          </div>
        ) : savedSchedules.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#888', background: '#f8fafc', borderRadius: '20px' }}>
            저장하거나 생성한 일정이 없습니다.<br />
            AI를 통해 일정을 생성하거나 피드에서 다른 사용자의 일정을 가져와 보세요!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {savedSchedules.map((schedule) => {
              const isSelected = selectedScheduleIds.includes(schedule.id);
              return (
                <div 
                  key={schedule.id} 
                  className="saved-itinerary-card"
                  style={{
                    border: isSelected ? '1.5px solid #8c52ff' : '1.5px solid #f1f5f9',
                    backgroundColor: isSelected ? '#faf8ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(schedule.id)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#8c52ff', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {schedule.title}
                          </h4>
                          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                            📍 {schedule.city} • {schedule.itineraryData?.itinerary?.length || 0}일 코스
                          </p>
                        </div>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: schedule.isShared ? '#f3eeff' : '#f1f5f9',
                          color: schedule.isShared ? '#8c52ff' : '#64748b',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {schedule.isShared ? "공유 중 🌐" : "비공개 🔒"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => handleActivateSchedule(schedule)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#8c52ff',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <MapIcon size={13} />
                      지도로 보기
                    </button>

                    <button
                      onClick={() => handleEndJourney(schedule)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      <span>🏁</span>
                      여행 종료 (추억 보관)
                    </button>

                    <button
                      onClick={() => handleToggleShare(schedule)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                      title="피드 공유"
                    >
                      <Share2 size={13} />
                    </button>

                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#ffe4e6',
                        color: '#e11d48',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      title="삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📸 지난 여행일지 & 추억회상 보관함 섹션 (후 단계) */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📸</span> 지난 여행일지 & 추억회상 ({journals.length})
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              다녀온 여행을 AI와 함께 정리하고 언제든 추억을 복기하세요
            </p>
          </div>

          <button
            onClick={() => setIsCreateJournalOpen(true)}
            style={{
              fontSize: '12px',
              fontWeight: 800,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#8c52ff',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(140, 82, 255, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <Sparkles size={14} />
            일지 생성
          </button>
        </div>

        {journalsLoading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#888' }}>
            <Loader2 className="animate-spin" style={{ margin: '0 auto 8px', color: '#8c52ff' }} />
            여행일지 및 추억 데이터를 불러오는 중입니다...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {journals.map((journal) => (
              <div
                key={journal.id}
                onClick={() => setSelectedJournalForRecall(journal)}
                style={{
                  position: 'relative',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  border: '1.5px solid #f1f5f9',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* 커버 이미지 */}
                <div style={{ position: 'relative', height: '130px' }}>
                  <img 
                    src={journal.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'} 
                    alt={journal.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(15,23,42,0.85) 100%)' }} />
                  
                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#8c52ff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {journal.mood || '🌿 힐링'}
                  </span>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      showConfirm("이 여행일지를 삭제하시겠습니까?", "일지 삭제", async () => {
                        try {
                          await fetch(`/api/journals?id=${journal.id}`, { method: 'DELETE' });
                          setJournals(prev => prev.filter(j => j.id !== journal.id));
                        } catch (err) {
                          console.error("Delete journal failed:", err);
                        }
                      });
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      border: 'none',
                      color: 'white',
                      padding: '5px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    title="일지 삭제"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: 'white', margin: 0 }}>{journal.title}</h4>
                    <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: '2px 0 0 0' }}>
                      📍 {journal.city} • {journal.createdAt ? new Date(journal.createdAt).toLocaleDateString() : '최근 기록'}
                    </p>
                  </div>
                </div>

                {/* 하단 요약 내용 & 복기 버튼 */}
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    💬 {journal.aiSummary || journal.content}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(journal.highlights || []).slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} style={{ fontSize: '10.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#8c52ff', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      추억 회상 카드 보기 ➔
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI 기능 활용 기록 영역 */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🤖</span> AI 기능 활용 기록
          </h3>
          {aiUsageHistory.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              <Trash2 size={13} />
              전체 비우기
            </button>
          )}
        </div>
        <div className="ai-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {aiUsageHistory.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', background: '#f8fafc', borderRadius: '12px' }}>
              아직 AI 기능 활용 기록이 없습니다.
            </div>
          ) : (
            aiUsageHistory.map((log) => (
              <div key={log.id} className="ai-history-item" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
                border: '1px solid #f1f5f9',
                position: 'relative'
              }}>
                <div className="ai-history-icon" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  {log.icon || '✨'}
                </div>
                <div className="ai-history-content" style={{ flex: 1, paddingRight: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', lineHeight: '1.4' }}>{log.title}</h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : log.date}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.5', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #8c52ff' }}>
                    {log.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteHistoryItem(log.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title="기록 삭제"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing}
          style={{
            width: '100%',
            fontSize: '12.5px', background: '#ffe4e6', color: '#e11d48',
            border: 'none', padding: '12px', borderRadius: '14px',
            cursor: isWithdrawing ? 'not-allowed' : 'pointer', fontWeight: 'bold'
          }}
        >
          {isWithdrawing ? "탈퇴 중..." : "회원 탈퇴 😢"}
        </button>
      </div>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />

      {/* 추억 회상 모달 (끝-여행정리 -> 여행일지 -> 추억회상) */}
      <MemoryRecallModal
        isOpen={!!selectedJournalForRecall}
        onClose={() => setSelectedJournalForRecall(null)}
        journal={selectedJournalForRecall}
        userName={user?.name || "트래블러"}
      />

      {/* AI 여행일지 생성 모달 */}
      <JournalCreateModal
        isOpen={isCreateJournalOpen}
        onClose={() => setIsCreateJournalOpen(false)}
        savedSchedules={savedSchedules}
        userId={user?.id || ''}
        dnaType={profileData?.dnaType}
        onSuccess={(newJournal) => {
          setJournals(prev => [newJournal, ...prev]);
          setSelectedJournalForRecall(newJournal);
        }}
      />
    </div>
  );
}

// 기본 샘플 추억 데이터
const defaultDemoJournals = [
  {
    id: 'demo-journal-1',
    title: '제주도 3박 4일 감성 힐링 여행',
    city: '제주',
    coverImage: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800',
    content: '함덕 해변과 성산일출봉을 중심으로 보낸 여유로운 힐링 여정입니다. AI 실시간 가이드 추천 덕분에 로컬 카페와 흑돼지 맛집을 찾아 최고의 추억이 되었습니다.',
    highlights: ['#제주바다', '#힐링슬로우', '#AI로컬추천', '#흑돼지맛집'],
    mood: '🌿 힐링 슬로우',
    rating: 5.0,
    aiSummary: '에메랄드빛 해변과 고즈넉한 정취를 만끽한 완벽한 힐링 여정이었습니다. AI 에이전트 맞춤 코스의 만점 만족도를 기록했습니다.',
    createdAt: new Date().toISOString(),
    journalData: {
      visitedSpotsCount: 9,
      dnaMatchScore: 99,
      dailyMemories: [
        { day: 1, theme: '함덕 해변 & 서우봉 산책', places: '함덕해수욕장 → 카페 서우봉', memo: '바람이 시원하고 바다 색깔이 예술이었습니다.' },
        { day: 2, theme: '성산일출봉 & 로컬 식도락', places: '성산일출봉 → 섭지코지 → 로컬 맛집', memo: 'AI 추천 흑돼지구이가 정말 맛있었습니다.' },
        { day: 3, theme: '우도 드라이브 & 감성 카페', places: '우도 천진항 → 검멀레 해변', memo: '우도 땅콩 아이스크림을 맛보며 추억을 쌓았습니다.' }
      ]
    }
  },
  {
    id: 'demo-journal-2',
    title: '교토 고즈넉 문화 & 단풍 탐방',
    city: '교토',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
    content: '청수사(키요미즈데라)와 아라시야마 대나무 숲을 걸으며 고요한 일본 전통 분위기를 만끽했습니다. 실시간 AI 음성/사진 번역 덕분에 메뉴판 주문이 매우 편했습니다.',
    highlights: ['#교토단풍', '#전통문화', '#AI메뉴판번역', '#아라시야마'],
    mood: '🏛️ 감성 문화재',
    rating: 4.9,
    aiSummary: '고풍스러운 사찰과 대나무 숲의 고즈넉함에 푹 빠졌던 역사문화 여행이었습니다. 사진 번역 렌즈 활용도가 뛰어났습니다.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    journalData: {
      visitedSpotsCount: 7,
      dnaMatchScore: 97,
      dailyMemories: [
        { day: 1, theme: '기온 거리 & 청수사 산책', places: '청수사 → 산넨자카 → 니넨자카', memo: '저녁 노을의 청수사 뷰가 잊혀지지 않습니다.' },
        { day: 2, theme: '아라시야마 대나무 숲', places: '치쿠린 → 텐류지 → 란덴열차', memo: '대나무 숲의 바람 소리가 마음을 평화롭게 해주었습니다.' }
      ]
    }
  }
];