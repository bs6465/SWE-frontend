// vite.config.js

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // <-- 1. 이거 추가

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. 현재 모드(development)에 맞는 .env 파일 로드
  // process.cwd() 위치에서 환경변수를 가져옵니다.
  const env = loadEnv(mode, process.cwd(), '');

  console.log('타겟 백엔드 주소:', env.BACKEND_URL);

  console.log('====================================');
  console.log('현재 모드:', mode);
  console.log('BACKEND_URL 값:', env.BACKEND_URL); // 여기가 undefined면 .env 파일 문제
  console.log('====================================');

  return {
    plugins: [
      react(),
      tailwindcss(), // <-- 2. 여기에도 추가
    ],

    server: {
      proxy: {
        '/api/': {
          target: env.BACKEND_URL, // .env의 BACKEND_URL 값을 여기서 사용
          changeOrigin: true,
          // 필요하다면 경로 재작성도 가능
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/socket.io/': {
          target: env.BACKEND_URL,
          ws: true, // 웹소켓 지원
          changeOrigin: true,
        },
      },
    },
  };
});
