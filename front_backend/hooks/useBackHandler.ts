import { useEffect, useRef, useCallback } from 'react';

/**
 * 모바일 물리 뒤로가기 버튼 / 브라우저 뒤로가기 버튼과 모달/오버레이 상태를 100% 동기화하는 훅
 * @param isOpen 모달/오버레이/지도의 열림 여부 (boolean)
 * @param onClose 모달/오버레이/지도를 닫는 콜백 함수
 * @param key 구분용 고유 키 (기본값: 'modal')
 */
export function useBackHandler(
    isOpen: boolean,
    onClose: () => void,
    key: string = 'modal'
) {
    const isPushedRef = useRef<boolean>(false);
    const onCloseRef = useRef(onClose);

    // 최신 onClose 참조 유지
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (isOpen) {
            // 모달이 열릴 때 브라우저 히스토리에 전용 프레임 push
            const stateKey = `traivl_back_${key}_${Date.now()}`;
            window.history.pushState({ traivlModal: stateKey }, '');
            isPushedRef.current = true;

            const handlePopState = (event: PopStateEvent) => {
                // 물리 뒤로가기 클릭 시 popstate 감지 ➔ onClose 실행
                if (isPushedRef.current) {
                    isPushedRef.current = false;
                    onCloseRef.current();
                }
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        } else {
            isPushedRef.current = false;
        }
    }, [isOpen, key]);

    // UI 버튼 (X 버튼, 뒤로가기 버튼 등)을 직접 눌러서 닫을 때 실행하는 동기화 함수
    const safeClose = useCallback(() => {
        if (isPushedRef.current) {
            isPushedRef.current = false;
            window.history.back();
        } else {
            onCloseRef.current();
        }
    }, []);

    return { safeClose };
}
