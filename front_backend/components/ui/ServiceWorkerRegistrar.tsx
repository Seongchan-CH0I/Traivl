"use client";

import { useEffect } from 'react';

/**
 * 서비스워커를 등록한다. PWA 설치 조건(매니페스트 + fetch 핸들러를 가진 SW)을 채우는 역할.
 * 개발 중에는 캐시가 핫리로드를 방해하므로 프로덕션에서만 등록한다.
 */
export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const register = () => {
            navigator.serviceWorker.register('/sw.js').catch((error) => {
                console.error('서비스워커 등록 실패:', error);
            });
        };

        // 초기 렌더와 경쟁하지 않도록 load 이후에 등록한다.
        if (document.readyState === 'complete') {
            register();
        } else {
            window.addEventListener('load', register);
            return () => window.removeEventListener('load', register);
        }
    }, []);

    return null;
}
