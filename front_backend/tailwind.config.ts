import type { Config } from "tailwindcss";

const config: Config = {
  // 핵심 1: 특정 ID(#tailwind-feed) 내부에서는 Tailwind가 기존 CSS보다 우선순위를 가집니다.
  important: "#tailwind-feed",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // v4에서 간혹 누락될 수 있는 색상 체계를 보강합니다.
      colors: {
        slate: {
          300: "#cbd5e1",
          900: "#0f172a",
        }
      }
    },
  },
  plugins: [],
};
export default config;