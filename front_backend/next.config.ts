import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 저장소 루트에도 package-lock.json이 있어 Next가 워크스페이스 루트를 상위 폴더로
  // 잘못 추론함. 서버리스 번들 파일 추적이 어긋나지 않도록 이 폴더로 고정한다.
  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'flagcdn.com' },
      { protocol: 'https', hostname: 'mblogthumb-phinf.pstatic.net' },
    ],
  },
};

export default nextConfig;
