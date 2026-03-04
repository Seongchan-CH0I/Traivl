/**
 * [성찬/주상 담당] AI 서버(FastAPI)와 통신하는 헬퍼 함수
 * 
 * NEXT_PUBLIC_AI_SERVER_URL 환경 변수에 따라 
 * 로컬(localhost) 또는 도커(ai-server) 주소를 사용합니다.
 */

export async function fetchAIRecommendation(destinations: string[], preferences: string = '') {
    const aiServerUrl = process.env.NEXT_PUBLIC_AI_SERVER_URL;
    
    console.log(`📡 AI 서버로 요청 보내는 중... 주소: ${aiServerUrl}/recommend`);
  
    try {
      const response = await fetch(`${aiServerUrl}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinations: destinations,
          preferences: preferences,
        }),
      });
  
      if (!response.ok) {
        throw new Error('AI 서버 연결 실패');
      }
  
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('AI 추천 서비스 호출 오류:', error);
      throw error;
    }
}
