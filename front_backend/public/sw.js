// Traivl PWA 서비스워커
// 이 앱은 실시간 장소/일정 데이터와 로그인 세션 비중이 커서, 캐시를 넓게 잡으면
// 오래된 데이터가 노출되는 쪽이 오프라인 지원보다 손해다. 그래서 전략을 좁게 유지한다.
//   - /api/*          : 캐시 금지 (항상 네트워크)
//   - 정적 에셋        : cache-first (해시 파일명이라 무효화 걱정 없음)
//   - 페이지 이동(HTML) : network-first + 오프라인 폴백

const VERSION = 'v1';
const STATIC_CACHE = `traivl-static-${VERSION}`;
const PAGE_CACHE = `traivl-page-${VERSION}`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll([OFFLINE_URL, '/images/icon-192.png']))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    // 버전이 올라가면 이전 캐시를 정리한다.
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

function isStaticAsset(url) {
    return (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname === '/manifest.json'
    );
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // GET 외에는 개입하지 않는다 (POST/PUT 등은 그대로 통과).
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // 외부 도메인(지도 타일, 이미지 CDN 등)은 건드리지 않는다.
    if (url.origin !== self.location.origin) return;

    // API 응답은 절대 캐시하지 않는다.
    if (url.pathname.startsWith('/api/')) return;

    if (isStaticAsset(url)) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        if (response.ok) {
                            const copy = response.clone();
                            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
                        }
                        return response;
                    })
            )
        );
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() =>
                    caches
                        .match(request)
                        .then((cached) => cached || caches.match(OFFLINE_URL))
                )
        );
    }
});
