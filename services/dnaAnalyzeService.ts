// 8가지의 추천 여행지 풀 (한국 4곳, 일본 4곳)
export const DESTINATIONS = [
    // 🇰🇷 한국
    {
        id: "KR_JEJU",
        name: "제주도, 한국",
        dnaType: "힐링 럭셔리러",
        description: "아름다운 자연 속에서 누리는 여유롭고 프라이빗한 휴식",
        tags: ["자연", "휴식", "프리미엄", "로컬"],
        primaryTags: ["RELAX", "LUXURY", "NATURE"],
        imageUrl: "https://images.unsplash.com/photo-1579290076269-aae9c869fb04?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "KR_SOKCHO",
        name: "속초/강릉, 한국",
        dnaType: "푸드트립 가성비러",
        description: "바다를 보며 즐기는 맛있는 현지 음식과 합리적인 식도락 여행",
        tags: ["맛집", "바다", "가성비", "힐링"],
        primaryTags: ["FOOD", "COST_EFFECTIVE", "RELAX"],
        imageUrl: "https://images.unsplash.com/photo-1542152345-d8ea37cf27ee?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "KR_SEOUL",
        name: "서울, 한국",
        dnaType: "컬처 트렌드세터",
        description: "박물관, 전시회부터 SNS 핫플까지 도심 속 다채로운 문화 체험",
        tags: ["도시", "문화", "SNS핫플", "트렌디"],
        primaryTags: ["CULTURE", "SNS", "THEME"],
        imageUrl: "https://images.unsplash.com/photo-1620295252814-709de7a0ea00?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "KR_BUSAN",
        name: "부산, 한국",
        dnaType: "액티비티 어드벤처러",
        description: "활기찬 해양 스포츠와 매력적인 현지 명소 탐험",
        tags: ["바다", "액티비티", "로컬", "에너지"],
        primaryTags: ["ACTIVE", "LOCAL", "FULL_COURSE"],
        imageUrl: "https://images.unsplash.com/photo-1520183171853-294c65377f0c?auto=format&fit=crop&q=80&w=800",
    },

    // 🇯🇵 일본
    {
        id: "JP_KYOTO",
        name: "교토, 일본",
        dnaType: "클래식 슬로우뷰어",
        description: "천년 고도의 사찰과 전통 거리를 천천히 거니는 고즈넉한 여행",
        tags: ["전통", "문화", "여유", "지식"],
        primaryTags: ["CULTURE", "RELAXED", "HISTORY"],
        imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "JP_OSAKA",
        name: "오사카, 일본",
        dnaType: "본투비 푸드파이터",
        description: "눈과 입이 쉴 틈 없는 도톤보리의 먹방 풀코스",
        tags: ["맛집", "풀코스", "즉흥", "에너지"],
        primaryTags: ["FOOD", "FULL_COURSE", "IMPROMPTU"],
        imageUrl: "https://images.unsplash.com/photo-1590559899731-a382839ce555?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "JP_TOKYO",
        name: "도쿄, 일본",
        dnaType: "프리미엄 쇼퍼홀릭",
        description: "화려한 도심 속 세련된 쇼핑과 전략적인 럭셔리 소비",
        tags: ["도시", "쇼핑", "프리미엄", "전략적"],
        primaryTags: ["SHOPPING", "LUXURY", "STRATEGIC"],
        imageUrl: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "JP_OKINAWA",
        name: "오키나와, 일본",
        dnaType: "욜로 즉흥러",
        description: "렌터카로 달리는 푸른 해변, 가성비로 챙기는 여유와 즉흥 여행",
        tags: ["바다", "즉흥", "가성비", "휴식"],
        primaryTags: ["RELAX", "IMPROMPTU", "COST_EFFECTIVE"],
        imageUrl: "https://images.unsplash.com/photo-1512402927289-543fd578cc92?auto=format&fit=crop&q=80&w=800",
    }
];

// 간단한 분석 알고리즘 (태그 점수 매칭 방식)
export function analyzeSurvey(answers: string[]) {
    // 답변(Q1_RELAX 등)에서 뒷부분(RELAX) 키워드만 추출
    const userTags = answers.map(answer => answer.split('_').slice(1).join('_'));

    let bestMatch = DESTINATIONS[0];
    let maxScore = -1;

    for (const dest of DESTINATIONS) {
        let score = 0;
        // 유저가 선택한 키워드가 여행지의 primaryTags에 포함되어 있으면 1점씩 추가
        for (const tag of userTags) {
            if (dest.primaryTags.includes(tag)) {
                score += 1;
            }
        }

        // 최고 점수 갱신
        if (score > maxScore) {
            maxScore = score;
            bestMatch = dest;
        }
    }

    // 동점일 경우 기본적으로 배열 앞쪽에 있는 곳이 선택됨
    return bestMatch;
}
