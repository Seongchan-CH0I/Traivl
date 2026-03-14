import { useState, useEffect } from 'react';

// 가상 유저(Mock User)의 데이터 구조를 정의합니다.
// 향후 실제 DB 스키마에 맞게 필드들을 추가/수정하시면 됩니다.
export interface User {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    dnaType?: string; // 예: '모험가', '휴양객' 등 여행 성향
}

// 앱 전체에서 로그인한 것으로 간주할 가짜 유저 데이터입니다.
const MOCK_USER: User = {
    id: 'test_user_01',
    name: '트래블러', // 이 이름이 화면에 나오는지 확인해보세요!
    email: 'test@traivl.com',
    profileImage: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix', // 귀여운 임시 랜덤 아바타
    dnaType: '모험가',
};

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // 너무 바로 로그인되면 실제 환경과 다르므로,
        // 마치 서버 통신을 하는 것처럼 0.5초(500ms)의 딜레이를 줍니다.
        const timer = setTimeout(() => {
            setUser(MOCK_USER);  // 0.5초 뒤에 가짜 유저 정보를 셋팅
            setIsLoading(false); // 로딩 끝!
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // 테스트를 위한 가짜 로그아웃 함수 
    // (실제 로그아웃 버튼 테스트가 필요할 때 사용하세요)
    const logout = () => {
        setUser(null);
    };

    return {
        user,                           // 유저 정보 객체 (로그인 안 된 경우 null)
        isAuthenticated: !!user,        // 로그인 여부 (true/false)
        isLoading,                      // 로딩 중 여부 (true/false)
        logout,                         // 로그아웃 함수
    };
};
