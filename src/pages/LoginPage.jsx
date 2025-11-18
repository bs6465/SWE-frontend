import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

function LoginPage() {
  // 1. username과 password를 위한 State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // 로그인 성공 시 페이지 이동용

  // 2. 로그인 제출 핸들러
  const handleLogin = async (e) => {
    e.preventDefault(); // 폼 기본 제출(새로고침) 방지
    setError(null);

    try {
      // 3. 백엔드 auth.controller.js의 'login' 함수 호출 ${API_URL}/
      const response = await fetch(`http://backend:3000/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 4. 로그인 실패 시 (백엔드가 401 등을 보낸 경우)
        throw new Error(data.message || '로그인 실패');
      }

      // 5. 로그인 성공 시!
      // (중요) 백엔드가 보내준 토큰을 브라우저 저장소(localStorage)에 저장
      localStorage.setItem('token', data.token);

      // (중요) 메인 대시보드 페이지('/')로 강제 이동
      navigate('/');
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message);
    }
  };

  // 3. 로그인 폼 UI (Tailwind CSS 적용)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">TIM8 대시보드 로그인</h2>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              아이디
            </label>
            <input
              id="username"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 오류 메시지 표시 */}
          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              로그인
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          계정이 없으신가요?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            회원가입하기
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
