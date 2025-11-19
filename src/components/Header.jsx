// src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header({ currentUser, socket }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. 로컬 스토리지 토큰 삭제
    localStorage.removeItem('token');

    // 2. 소켓 연결 끊기
    if (socket) socket.disconnect();

    // 3. 로그인 페이지로 이동
    navigate('/login');
  };

  return (
    <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 className="text-2xl font-bold text-indigo-600">TIM8 Dashboard</h1>
        <p className="text-sm text-gray-500">팀 협업을 위한 올인원 대시보드</p>
      </div>

      <div className="flex items-center space-x-4">
        {currentUser && (
          <>
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-gray-800">{currentUser.username} 님</p>
              <p className="text-xs text-gray-500">
                {currentUser.team_id ? '팀 접속 중' : '팀 없음'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
