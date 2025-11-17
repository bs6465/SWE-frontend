# ------------------------------------
# 1. 빌드(Build) 스테이지
# ------------------------------------
# node 18-alpine 버전을 기반으로 'builder'라는 별명 지정
FROM node:24-slim AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json (또는 yarn.lock) 먼저 복사
# (이 파일들이 변경되지 않으면 'npm install' 단계를 캐시에서 재사용)
COPY package*.json ./

# 의존성 설치
# 빌드가 필요하므로 'npm install'을 실행하여 빌드 모듈까지 설치
RUN npm install

# 나머지 소스코드 전체 복사
COPY . .

# React 앱 빌드
RUN npm run build

# ------------------------------------
# 2. 서빙(Serve) 스테이지
# ------------------------------------
# 방금 질문하셨던 Nginx의 alpine 버전을 사용 (매우 가벼움)
FROM nginx:latest

# 빌드 스테이지('builder')에서 생성된 /app/build 폴더의 내용물 전체를
# Nginx의 기본 HTML 서빙 폴더로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# (선택) React Router 사용 시 Nginx 설정 파일 복사
# 이 파일이 없으면 404 에러 발생 (아래 2번 항목 참고)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80번 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]