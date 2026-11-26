/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint는 이번 단계에서 설치하지 않으므로 빌드 중 린트를 건너뜁니다.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
