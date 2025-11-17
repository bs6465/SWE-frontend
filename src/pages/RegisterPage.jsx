import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 👈 Link 추가

const API_URL = import.meta.env.VITE_API_URL; // 백엔드 주소 (가정)

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // 1. 백엔드 auth.controller.js의 'register' 함수 호출
      const response = await fetch(`/api/auth/register`, {
        // 👈 API 경로 (가정)
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        // 409 (이미 사용 중인 ID) 등 백엔드 에러
        throw new Error(data.message || '회원가입 실패');
      }

      // 2. 회원가입 성공!
      setSuccess('회원가입 성공! 로그인 페이지로 이동합니다...');

      // 3초 뒤 로그인 페이지로 자동 이동
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Register Error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">회원가입</h2>

        <form className="space-y-6" onSubmit={handleRegister}>
          {/* (아이디, 비밀번호 input은 LoginPage와 동일) */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              사용할 아이디
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
              사용할 비밀번호
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

          {/* 성공 또는 오류 메시지 표시 */}
          {error && <p className="text-sm text-center text-red-600">{error}</p>}
          {success && <p className="text-sm text-center text-green-600">{success}</p>}

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              disabled={success} // 성공 시 버튼 비활성화
            >
              가입하기
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
