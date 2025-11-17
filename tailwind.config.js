// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // 👈 이 줄을 꼭 추가/수정하세요
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
