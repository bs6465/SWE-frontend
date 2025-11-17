import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

function CreateTeamPage() {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`/api/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // 👈 인증 필수
        },
        body: JSON.stringify({ teamName }), // 👈 예시 body
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '팀 생성에 실패했습니다.');
      }

      // 팀 생성 성공!
      // (중요) 백엔드가 보내준 토큰을 브라우저 저장소(localStorage)에 저장
      // 메인 대시보드('/')로 돌아갑니다.
      // App.jsx의 useEffect가 다시 실행되면서 getMe를 호출할 것이고,
      // 이번에는 team_id가 있으므로 대시보드가 정상 로드됩니다.
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">팀 생성하기</h2>
        <p className="text-center text-gray-600">
          대시보드를 사용하려면 먼저 팀을 생성해야 합니다.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
              팀 이름
            </label>
            <input
              id="teamName"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              팀 생성 및 시작하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTeamPage;
