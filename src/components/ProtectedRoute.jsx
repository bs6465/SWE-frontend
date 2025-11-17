import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  // 1. localStorage에서 토큰을 확인
  const token = localStorage.getItem('token');

  // 2. 토큰이 있으면?
  if (token) {
    // 3. 자식 컴포넌트(대시보드 등)를 보여줌
    return <Outlet />;
  }

  // 4. 토큰이 없으면? 로그인 페이지로 강제 이동
  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;
