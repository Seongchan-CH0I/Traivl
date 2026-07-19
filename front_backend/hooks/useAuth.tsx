import React, { createContext, useContext, useState, useEffect } from 'react';

// 유저의 데이터 구조
export interface User {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    dnaType?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (id: string, password: string) => Promise<{ success: boolean; message: string }>;
    signup: (id: string, email: string, name: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    withdraw: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ 앱 전체의 로그인 상태를 보관하는 바구니
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // 앱 진입 시 localStorage에 저장된 로그인 정보 복원
        try {
            const savedUser = localStorage.getItem('traivl_user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (err) {
            console.error('Failed to load user from localStorage:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 로그인 API 호출
    const login = async (id: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, password }),
            });
            const data = await res.json();
            if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem('traivl_user', JSON.stringify(data.user));
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || '로그인에 실패했습니다.' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: '서버와 통신하는 중 오류가 발생했습니다.' };
        }
    };

    // 회원가입 API 호출
    const signup = async (id: string, email: string, name: string, password: string) => {
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, email, name, password }),
            });
            const data = await res.json();
            if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem('traivl_user', JSON.stringify(data.user));
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || '회원가입에 실패했습니다.' };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: '서버와 통신하는 중 오류가 발생했습니다.' };
        }
    };

    // 로그아웃 처리
    const logout = () => {
        setUser(null);
        localStorage.removeItem('traivl_user');
    };

    // 회원 탈퇴 처리
    const withdraw = async () => {
        if (!user) return { success: false, message: '로그인이 필요합니다.' };
        try {
            const res = await fetch(`/api/profile/${user.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                logout();
                return { success: true, message: data.message || '회원 탈퇴가 완료되었습니다.' };
            } else {
                return { success: false, message: data.error || '회원 탈퇴에 실패했습니다.' };
            }
        } catch (error) {
            console.error('Withdraw error:', error);
            return { success: false, message: '서버와 통신하는 중 오류가 발생했습니다.' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, withdraw }}>
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

