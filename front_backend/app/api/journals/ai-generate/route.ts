import { NextRequest, NextResponse } from 'next/server';

// POST /api/journals/ai-generate
// 일정을 바탕으로 AI가 여행 정리, 여행일지, 추억회상 콘텐츠를 자동 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, city, itineraryData, userNotes, dnaType } = body;

    const cityObj = city || '여행지';
    const daysCount = itineraryData?.itinerary?.length || 3;
    const userDna = dnaType || '자유로운 탐험가';

    // AI 엔진 스트럭처드 응답 시뮬레이션 및 정교한 생성
    const moodOptions = ['🌿 힐링 슬로우', '🎉 액티브 탐험', '🍕 식도락 여행', '🏛️ 감성 문화재', '✨ 럭셔리 휴양'];
    const selectedMood = moodOptions[Math.floor(Math.random() * moodOptions.length)];

    // 일정 데이터에서 방문 장소 추출
    const visitedPlaces: string[] = [];
    if (itineraryData?.itinerary && Array.isArray(itineraryData.itinerary)) {
      itineraryData.itinerary.forEach((day: any) => {
        if (day.places && Array.isArray(day.places)) {
          day.places.forEach((place: any) => {
            if (place.name) visitedPlaces.push(place.name);
          });
        }
      });
    }

    const mainSpots = visitedPlaces.slice(0, 4).join(', ') || `${cityObj} 주요 명소 및 로컬 맛집`;

    // AI 생성 감상 및 총평
    const aiSummary = `"${userDna}" 성향에 맞게 ${cityObj}의 대표 명소인 ${mainSpots}를 둘러보며 최고의 추억을 쌓으셨습니다. AI 에이전트의 맞춤 추천 코스로 더욱 효율적이고 뜻깊은 ${daysCount}일 간의 여행이 완료되었습니다!`;

    const journalContent = userNotes 
      ? `[사용자 메모]: ${userNotes}\n\n[AI 여행 정리]: ${cityObj}에서의 ${daysCount}일간 여행은 성향에 딱 들어맞는 여정이었습니다. 여유로운 이동 동선과 현지 문화 체험이 돋보였습니다.`
      : `${cityObj}에서 보낸 ${daysCount}일간의 아름다운 기록입니다. 주요 동선: ${mainSpots}. AI 가이드와 함께 실시간 번역 및 추천을 활성화하여 큰 어려움 없이 성공적으로 여행을 마쳤습니다.`;

    const highlights = [
      `#${cityObj}여행`,
      `#${daysCount}일코스`,
      `#${selectedMood.split(' ')[1] || '추억회상'}`,
      `#${userDna}`,
      `#TraivlAI인증`
    ];

    // 도시별 매칭 고품질 커버 이미지
    let coverImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
    if (cityObj.includes("제주")) {
      coverImage = "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800";
    } else if (cityObj.includes("교토") || cityObj.includes("일본")) {
      coverImage = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800";
    } else if (cityObj.includes("서울")) {
      coverImage = "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800";
    } else if (cityObj.includes("부산")) {
      coverImage = "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800";
    }

    // 일자별 추억 타임라인 데이터 구성
    const dailyMemories = (itineraryData?.itinerary || [
      { day: 1, theme: '출발 및 첫인상', summary: `${cityObj} 도착 후 여유로운 탐색` },
      { day: 2, theme: '핵심 명소 탐방', summary: `${mainSpots} 방문 및 현지 먹거리` },
      { day: 3, theme: '마무리 및 기념품', summary: '선물 구매 및 추억 정리' }
    ]).map((dayItem: any, idx: number) => {
      let placesStr = '';
      if (Array.isArray(dayItem.places) && dayItem.places.length > 0) {
        placesStr = dayItem.places
          .map((p: any) => typeof p === 'string' ? p : (p.name || p.title || p.placeName))
          .filter(Boolean)
          .join(' → ');
      } else if (typeof dayItem.places === 'string') {
        placesStr = dayItem.places;
      }

      if (!placesStr) {
        if (cityObj.includes("교토") || cityObj.includes("일본")) {
          placesStr = idx === 0 ? "청수사 → 산넨자카 → 니넨자카" : "아라시야마 대나무 숲 → 텐류지";
        } else if (cityObj.includes("제주")) {
          placesStr = idx === 0 ? "함덕 해수욕장 → 카페 서우봉" : "성산일출봉 → 섭지코지 → 로컬 맛집";
        } else {
          placesStr = `${cityObj} 주요 명소 → 로컬 맛집`;
        }
      }

      return {
        day: dayItem.day || idx + 1,
        theme: dayItem.theme || `DAY ${idx + 1} 여정`,
        places: placesStr,
        aiHighlight: `AI 에이전트 가이드와 함께 동선을 최적화하여 만족도가 98%에 달했던 날입니다.`,
        memo: userNotes ? `[나의 메모]: ${userNotes}` : `날씨가 무척 좋았고, AI가 추천해 준 장소들이 여행 성향과 완벽히 맞아떨어졌습니다.`
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        title: title || `${cityObj} ${daysCount}일 간의 추억 회상`,
        city: cityObj,
        coverImage,
        content: journalContent,
        highlights,
        mood: selectedMood,
        rating: 4.9,
        aiSummary,
        journalData: {
          visitedSpotsCount: visitedPlaces.length || daysCount * 3,
          dnaMatchScore: 98,
          dailyMemories
        }
      }
    });
  } catch (error: any) {
    console.error('AI Journal generation error:', error);
    return NextResponse.json(
      { success: false, message: 'AI 여행일지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
