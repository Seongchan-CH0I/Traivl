import React, { createContext, useContext, useState, useEffect } from 'react';

// 가상 유저(Mock User)의 데이터 구조
export interface User {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    dnaType?: string;
}

// 앱 전체에서 로그인한 것으로 간주할 가짜 유저 데이터
const MOCK_USER: User = {
    id: 'test_user_01',
    name: '트래블러',
    email: 'test@traivl.com',
    profileImage: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    dnaType: '모험가',
};

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ 앱 전체의 로그인 상태를 보관하는 바구니
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // 앱이 처음 로드될 때만 딱 1번 실행 (페이지를 이동해도 이 상태는 유지됩니다)
        const timer = setTimeout(() => {
            setUser(MOCK_USER);
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ 다른 컴포넌트에서 유저 정보를 가져올 때 쓸 함수
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
